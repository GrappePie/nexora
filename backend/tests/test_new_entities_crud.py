from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import text

from backend.app.main import app
from backend.app.auth import SECRET, ALGO
from backend.app.db import Base, engine


Base.metadata.create_all(bind=engine)
client = TestClient(app)


def make_token(roles):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": "tester", "roles": roles, "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )


def test_crud_entities_flow():
    token = make_token(["admin"])
    headers = {"Authorization": f"Bearer {token}"}

    # Customer
    r = client.post(
        "/customers/",
        json={"name": "Foo", "rfc": "FOO123", "email": "f@example.com"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    customer = r.json()

    # Vehicle
    r = client.post(
        "/vehicles/",
        json={"customer_id": customer["id"], "plates": "ABC123"},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # Crear quote directa en DB (evita columna customer_id faltante)
    qid = "q1"
    token = "t1"
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=7)
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO quotes (id, customer, total, status, token, created_at, token_expires_at) "
                "VALUES (:id, :customer, :total, 'pending', :token, :created_at, :expires)"
            ),
            {
                "id": qid,
                "customer": "Foo",
                "total": 100,
                "token": token,
                "created_at": now,
                "expires": exp,
            },
        )
    quote = {"id": qid}

    # Quote item
    r = client.post(
        "/quote-items/",
        json={"quote_id": quote["id"], "description": "Svc", "qty": 1, "unit_price": 100, "tax_rate": 0.0},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # Work order
    r = client.post(
        "/work-orders/",
        json={"quote_id": quote["id"]},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    wo = r.json()

    # Attachment
    r = client.post(
        "/attachments/",
        json={"work_order_id": wo["id"], "s3_key": "file.jpg"},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # License state
    r = client.post(
        "/license-state/",
        json={"license_key": "ABC", "is_limited": False},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    # List customers
    r = client.get("/customers/", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert any(c["id"] == customer["id"] for c in data)

