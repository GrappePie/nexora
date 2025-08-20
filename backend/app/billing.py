import logging
import os

from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session

from .auth import require_roles
from .db import get_db
from .models import SubscriptionORM

router = APIRouter(prefix="/portal/api/billing", tags=["billing"])

logger = logging.getLogger(__name__)


class SubscriptionRequest(BaseModel):
    """Datos mínimos para gestionar una suscripción."""
    customer_id: str
    plan_id: str


class SubscriptionResponse(BaseModel):
    customer_id: str
    plan_id: str
    status: Literal["active", "cancelled"]


class StripeProvider:
    name = "stripe"

    def __init__(self) -> None:
        import stripe

        stripe.api_key = os.getenv("STRIPE_API_KEY", "")
        self.stripe = stripe
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    def create_subscription(self, customer_id: str, plan_id: str) -> str:
        sub = self.stripe.Subscription.create(
            customer=customer_id, items=[{"price": plan_id}]
        )
        return sub["id"]

    def cancel_subscription(self, subscription_id: str) -> None:
        self.stripe.Subscription.delete(subscription_id)

    def validate_webhook(self, payload: bytes, sig_header: str):
        return self.stripe.Webhook.construct_event(
            payload, sig_header, self.webhook_secret
        )

    def parse_event(self, event):
        obj = event["data"]["object"]
        if event["type"] == "customer.subscription.deleted":
            status = "cancelled"
        else:
            status = obj.get("status", "active")
        return obj["id"], status


class MercadoPagoProvider:
    name = "mercadopago"

    def __init__(self) -> None:
        import mercadopago

        token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
        self.sdk = mercadopago.SDK(token)

    def create_subscription(self, customer_id: str, plan_id: str) -> str:
        sub = self.sdk.subscription().create(
            {"preapproval_plan_id": plan_id, "payer_email": customer_id}
        )
        return sub["response"]["id"]

    def cancel_subscription(self, subscription_id: str) -> None:
        self.sdk.subscription().cancel(subscription_id)

    def validate_webhook(self, payload: bytes, sig_header: str):
        import json

        return json.loads(payload.decode())

    def parse_event(self, event):
        data = event.get("data", {}) or {}
        status = event.get("type")
        if status == "subscription_preapproval_cancelled":
            status = "cancelled"
        else:
            status = "active"
        return data.get("id"), status


class PaddleProvider:
    name = "paddle"

    def __init__(self) -> None:
        from paddle_client import PaddleClient

        api_key = os.getenv("PADDLE_API_KEY", "")
        self.client = PaddleClient(api_key=api_key)

    def create_subscription(self, customer_id: str, plan_id: str) -> str:
        sub = self.client.subscriptions.create(
            {"plan_id": plan_id, "customer_id": customer_id}
        )
        return sub["id"]

    def cancel_subscription(self, subscription_id: str) -> None:
        self.client.subscriptions.cancel(subscription_id)

    def validate_webhook(self, payload: bytes, sig_header: str):
        import json

        return json.loads(payload.decode())

    def parse_event(self, event):
        data = event.get("data", {}) or {}
        return data.get("id"), data.get("status", "active")


def get_billing_provider():
    provider = os.getenv("BILLING_PROVIDER", "stripe").lower()
    if provider == "stripe":
        return StripeProvider()
    if provider == "mercadopago":
        return MercadoPagoProvider()
    if provider == "paddle":
        return PaddleProvider()
    raise RuntimeError("Unsupported billing provider")


@router.post("/subscribe", response_model=SubscriptionResponse)
def subscribe(
    payload: SubscriptionRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    logger.info("subscribe %s to %s", payload.customer_id, payload.plan_id)
    provider = get_billing_provider()
    ext_id = provider.create_subscription(payload.customer_id, payload.plan_id)
    sub = SubscriptionORM(
        customer_id=payload.customer_id,
        plan_id=payload.plan_id,
        provider=provider.name,
        provider_subscription_id=ext_id,
        status="active",
    )
    db.add(sub)
    db.commit()
    return SubscriptionResponse(
        customer_id=sub.customer_id, plan_id=sub.plan_id, status=sub.status
    )


@router.post("/cancel", response_model=SubscriptionResponse)
def cancel(
    payload: SubscriptionRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    logger.info("cancel subscription %s for %s", payload.plan_id, payload.customer_id)
    sub = (
        db.query(SubscriptionORM)
        .filter_by(customer_id=payload.customer_id, plan_id=payload.plan_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="subscription_not_found")
    provider = get_billing_provider()
    provider.cancel_subscription(sub.provider_subscription_id)
    sub.status = "cancelled"
    db.commit()
    return SubscriptionResponse(
        customer_id=sub.customer_id, plan_id=sub.plan_id, status=sub.status
    )


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    logger.info("billing webhook")
    provider = get_billing_provider()
    payload = await request.body()
    sig_header = (
        request.headers.get("stripe-signature")
        if provider.name == "stripe"
        else request.headers.get("x-signature", "")
    )
    try:
        event = provider.validate_webhook(payload, sig_header)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid_signature")

    sub_id, status = provider.parse_event(event)
    if sub_id and status:
        sub = (
            db.query(SubscriptionORM)
            .filter_by(provider_subscription_id=sub_id)
            .first()
        )
        if sub:
            sub.status = status
            db.commit()
    return {"received": True}
