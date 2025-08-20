import os
from fastapi.testclient import TestClient
from sqlalchemy import text
import stripe
from datetime import datetime, timedelta, timezone
from jose import jwt

from backend.app.main import app, engine
from backend.app.auth import SECRET, ALGO

client = TestClient(app)


def _auth_headers():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"sub": "tester", "roles": ["admin"], "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )
    return {"Authorization": f"Bearer {token}"}


def test_subscribe_and_webhook(monkeypatch):
    os.environ["BILLING_PROVIDER"] = "stripe"
    os.environ["STRIPE_API_KEY"] = "sk_test"
    os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test"

    monkeypatch.setattr(
        stripe.Subscription,
        "create",
        staticmethod(lambda customer, items: {"id": "sub_123"}),
    )
    monkeypatch.setattr(
        stripe.Subscription, "delete", staticmethod(lambda id: {"id": id})
    )

    payload = {"customer_id": "cus_123", "plan_id": "plan_basic"}
    r = client.post(
        "/portal/api/billing/subscribe", json=payload, headers=_auth_headers()
    )
    assert r.status_code == 200
    assert r.json()["status"] == "active"

    with engine.begin() as conn:
        row = conn.execute(
            text(
                "SELECT status, provider_subscription_id FROM subscriptions WHERE customer_id='cus_123'"
            )
        ).first()
        assert row is not None
        assert row.status == "active"
        sub_id = row.provider_subscription_id

    def fake_construct_event(payload, sig, secret):
        return {
            "type": "customer.subscription.deleted",
            "data": {"object": {"id": sub_id}},
        }

    monkeypatch.setattr(
        stripe.Webhook, "construct_event", staticmethod(fake_construct_event)
    )

    r2 = client.post(
        "/portal/api/billing/webhook",
        headers={"stripe-signature": "t"},
        content=b"{}",
    )
    assert r2.status_code == 200

    with engine.begin() as conn:
        row2 = conn.execute(
            text(
                "SELECT status FROM subscriptions WHERE provider_subscription_id=:id"
            ),
            {"id": sub_id},
        ).first()
        assert row2.status == "cancelled"


def test_cancel_endpoint(monkeypatch):
    os.environ["BILLING_PROVIDER"] = "stripe"
    os.environ["STRIPE_API_KEY"] = "sk_test"

    monkeypatch.setattr(
        stripe.Subscription,
        "create",
        staticmethod(lambda customer, items: {"id": "sub_cancel"}),
    )
    payload = {"customer_id": "cus_cancel", "plan_id": "plan_basic"}
    client.post(
        "/portal/api/billing/subscribe", json=payload, headers=_auth_headers()
    )

    monkeypatch.setattr(
        stripe.Subscription, "delete", staticmethod(lambda id: {"id": id})
    )
    r = client.post(
        "/portal/api/billing/cancel", json=payload, headers=_auth_headers()
    )
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"

    with engine.begin() as conn:
        row = conn.execute(
            text(
                "SELECT status FROM subscriptions WHERE customer_id='cus_cancel'"
            )
        ).first()
        assert row.status == "cancelled"


def test_cancel_nonexistent_subscription_returns_404(monkeypatch):
    os.environ["BILLING_PROVIDER"] = "stripe"
    os.environ["STRIPE_API_KEY"] = "sk_test"

    monkeypatch.setattr(
        stripe.Subscription, "delete", staticmethod(lambda id: {"id": id})
    )
    payload = {"customer_id": "nope", "plan_id": "plan_basic"}
    r = client.post(
        "/portal/api/billing/cancel", json=payload, headers=_auth_headers()
    )
    assert r.status_code == 404
    assert r.json().get("detail") == "subscription_not_found"

def test_webhook_invalid_signature(monkeypatch):
    os.environ["BILLING_PROVIDER"] = "stripe"
    os.environ["STRIPE_API_KEY"] = "sk_test"
    os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test"

    def raise_error(payload, sig, secret):
        raise ValueError("bad")

    monkeypatch.setattr(
        stripe.Webhook, "construct_event", staticmethod(raise_error)
    )

    r = client.post(
        "/portal/api/billing/webhook",
        headers={"stripe-signature": "bad"},
        content=b"{}",
    )
    assert r.status_code == 400
