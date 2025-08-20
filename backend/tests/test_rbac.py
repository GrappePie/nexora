from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt

from backend.app.main import app
from backend.app.auth import SECRET, ALGO


def make_token(roles):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": "tester", "roles": roles, "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )


def test_cfdi_forbidden_for_non_admin(tmp_path, monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    client = TestClient(app)
    token = make_token(["user"])
    payload = {
        "customer": "ACME",
        "items": [{"description": "Servicio", "quantity": 1, "unit_price": 100.0}],
    }
    r = client.post("/cfdi/", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_billing_subscribe_requires_admin():
    client = TestClient(app)
    token = make_token(["user"])
    payload = {"customer_id": "c1", "plan_id": "p1"}
    r = client.post(
        "/portal/api/billing/subscribe", json=payload, headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 403


def test_quote_approval_requires_admin():
    client = TestClient(app)
    token_user = make_token(["user"])
    token_admin = make_token(["admin"])
    # create quote with user role
    r = client.post(
        "/quotes/",
        json={"customer": "RBAC", "total": 1},
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert r.status_code == 200
    q = r.json()

    # user cannot approve
    r_forbidden = client.post(
        f"/quotes/{q['id']}/approve",
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert r_forbidden.status_code == 403

    # admin can approve
    r_ok = client.post(
        f"/quotes/{q['id']}/approve",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert r_ok.status_code == 200
