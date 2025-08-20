from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Literal


router = APIRouter(prefix="/portal/api/billing", tags=["billing"])


class SubscriptionRequest(BaseModel):
    """Datos mínimos para gestionar una suscripción."""
    customer_id: str
    plan_id: str


class SubscriptionResponse(BaseModel):
    customer_id: str
    plan_id: str
    status: Literal["active", "cancelled"]


@router.post("/subscribe", response_model=SubscriptionResponse)
def subscribe(payload: SubscriptionRequest):
    """Crea una suscripción para el cliente indicado."""
    return SubscriptionResponse(
        customer_id=payload.customer_id,
        plan_id=payload.plan_id,
        status="active",
    )


@router.post("/cancel", response_model=SubscriptionResponse)
def cancel(payload: SubscriptionRequest):
    """Cancela la suscripción del cliente."""
    return SubscriptionResponse(
        customer_id=payload.customer_id,
        plan_id=payload.plan_id,
        status="cancelled",
    )


@router.post("/webhook")
async def webhook(request: Request):
    """Recibe eventos de pago de Stripe o Mercado Pago."""
    event = await request.json()
    provider = event.get("provider")
    return {"received": True, "provider": provider}
