from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt

from backend.app.main import app
from backend.app.auth import SECRET, ALGO

client = TestClient(app)

def make_token(roles):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": "tester", "roles": roles, "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )

def test_stock_crud_and_permissions():
    token_admin = make_token(["admin"])
    token_user = make_token(["user"])

    payload = {"item": "Widget", "quantity": 5, "unit_price": 2.0}
    r = client.post(
        "/stock/", json=payload, headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["item"] == "Widget"

    r_update = client.put(
        f"/stock/{data['id']}",
        json={"quantity": 10},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert r_update.status_code == 200
    assert r_update.json()["quantity"] == 10

    r_list = client.get(
        "/stock/", headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r_list.status_code == 200
    items = r_list.json()
    assert any(it["id"] == data["id"] for it in items)

    r_delete = client.delete(
        f"/stock/{data['id']}", headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r_delete.status_code == 200
    assert r_delete.json() == {"deleted": True}

    r_forbidden = client.post(
        "/stock/",
        json={"item": "X", "quantity": 1, "unit_price": 1.0},
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert r_forbidden.status_code == 403

    r_list_forbidden = client.get("/stock/", headers={"Authorization": f"Bearer {token_user}"})
    assert r_list_forbidden.status_code == 403

def test_invoice_crud_and_permissions():
    token_admin = make_token(["admin"])
    token_user = make_token(["user"])

    payload = {"customer": "ACME", "total": 10.0}
    r = client.post(
        "/invoices/", json=payload, headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["customer"] == "ACME"

    r_get = client.get(
        f"/invoices/{data['id']}", headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r_get.status_code == 200

    r_update = client.put(
        f"/invoices/{data['id']}",
        json={"total": 20.0},
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert r_update.status_code == 200
    assert r_update.json()["total"] == 20.0

    r_list = client.get(
        "/invoices/", headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r_list.status_code == 200
    items = r_list.json()
    assert any(it["id"] == data["id"] for it in items)

    r_delete = client.delete(
        f"/invoices/{data['id']}", headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert r_delete.status_code == 200
    assert r_delete.json() == {"deleted": True}

    r_forbidden = client.post(
        "/invoices/",
        json={"customer": "Nope", "total": 1.0},
        headers={"Authorization": f"Bearer {token_user}"},
    )
    assert r_forbidden.status_code == 403

    r_list_forbidden = client.get("/invoices/", headers={"Authorization": f"Bearer {token_user}"})
    assert r_list_forbidden.status_code == 403
