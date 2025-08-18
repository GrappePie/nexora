from fastapi.testclient import TestClient
from backend.app.main import app
from sqlalchemy import text
from backend.app.db import engine
from datetime import datetime, timezone, timedelta

client = TestClient(app)

def _expire_token(token: str):
    # Marca el token como expirado en DB
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE quotes SET token_expires_at = :ts WHERE token = :t"),
            {"ts": datetime.now(timezone.utc) - timedelta(seconds=1), "t": token},
        )


def test_create_and_approve_quote():
    # Crear
    payload = {"customer": "ACME", "total": 123.45}
    r = client.post("/quotes/", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["customer"] == "ACME"
    assert data["total"] == 123.45
    assert data["status"] == "pending"
    assert isinstance(data["token"], str) and len(data["token"]) > 0

    # Listar
    r2 = client.get("/quotes/")
    assert r2.status_code == 200
    items = r2.json()
    assert any(it["id"] == data["id"] for it in items)

    # Approve check
    r3 = client.post("/quotes/approve-check", json={"token": data["token"]})
    assert r3.status_code == 200
    chk = r3.json()
    assert chk["ok"] is True
    assert chk["quote_id"] == data["id"]

    # Token inválido
    r4 = client.post("/quotes/approve-check", json={"token": "nope"})
    assert r4.status_code == 200
    chk2 = r4.json()
    assert chk2["ok"] is False
    assert chk2["quote_id"] is None


def test_approve_check_empty_token_returns_400():
    r = client.post("/quotes/approve-check", json={"token": ""})
    assert r.status_code == 400
    assert r.json().get("detail") == "token_required"

    r2 = client.post("/quotes/approve-check", json={"token": "   "})
    assert r2.status_code == 400
    assert r2.json().get("detail") == "token_required"


def test_approve_check_accepts_trimmed_token():
    # Crear una nueva cotización
    payload = {"customer": "Trim Inc.", "total": 50.0}
    r = client.post("/quotes/", json=payload)
    assert r.status_code == 200
    data = r.json()

    # Usar token con espacios alrededor
    r2 = client.post("/quotes/approve-check", json={"token": f"  {data['token']}  "})
    assert r2.status_code == 200
    chk = r2.json()
    assert chk["ok"] is True
    assert chk["quote_id"] == data["id"]


def test_approve_quote_happy_path_and_idempotent():
    # Crear
    r = client.post("/quotes/", json={"customer": "Foo", "total": 10})
    assert r.status_code == 200
    q = r.json()
    assert q["status"] == "pending"

    # Aprobar (pending -> approved)
    r2 = client.post(f"/quotes/{q['id']}/approve")
    assert r2.status_code == 200
    q2 = r2.json()
    assert q2["status"] == "approved"

    # Idempotente (approved -> approved)
    r3 = client.post(f"/quotes/{q['id']}/approve")
    assert r3.status_code == 200
    q3 = r3.json()
    assert q3["status"] == "approved"

    # Transición inválida (approved -> rejected)
    r4 = client.post(f"/quotes/{q['id']}/reject")
    assert r4.status_code == 409
    assert r4.json().get("detail") == "invalid_transition"


def test_reject_quote_happy_path_and_idempotent():
    # Crear
    r = client.post("/quotes/", json={"customer": "Bar", "total": 20})
    assert r.status_code == 200
    q = r.json()
    assert q["status"] == "pending"

    # Rechazar (pending -> rejected)
    r2 = client.post(f"/quotes/{q['id']}/reject")
    assert r2.status_code == 200
    q2 = r2.json()
    assert q2["status"] == "rejected"

    # Idempotente (rejected -> rejected)
    r3 = client.post(f"/quotes/{q['id']}/reject")
    assert r3.status_code == 200
    q3 = r3.json()
    assert q3["status"] == "rejected"

    # Transición inválida (rejected -> approved)
    r4 = client.post(f"/quotes/{q['id']}/approve")
    assert r4.status_code == 409
    assert r4.json().get("detail") == "invalid_transition"


def test_approve_reject_quote_not_found_returns_404():
    r = client.post("/quotes/NOEXIST/approve")
    assert r.status_code == 404
    assert r.json().get("detail") == "quote_not_found"

    r2 = client.post("/quotes/NOEXIST/reject")
    assert r2.status_code == 404
    assert r2.json().get("detail") == "quote_not_found"


def test_approve_confirm_by_token_happy_path_and_idempotent():
    # Crear cotización
    r = client.post("/quotes/", json={"customer": "Tok", "total": 33.3})
    assert r.status_code == 200
    q = r.json()

    # Confirmar por token (pending -> approved)
    r2 = client.post("/quotes/approve-confirm", json={"token": q["token"]})
    assert r2.status_code == 200
    q2 = r2.json()
    assert q2["status"] == "approved"

    # Idempotente (approved -> approved)
    r3 = client.post("/quotes/approve-confirm", json={"token": q["token"]})
    assert r3.status_code == 200
    q3 = r3.json()
    assert q3["status"] == "approved"


def test_approve_confirm_by_token_invalid_transition_and_errors():
    # Crear y rechazar primero
    r = client.post("/quotes/", json={"customer": "Tok2", "total": 10})
    assert r.status_code == 200
    q = r.json()
    rrej = client.post(f"/quotes/{q['id']}/reject")
    assert rrej.status_code == 200

    # Intentar aprobar por token tras reject -> 409
    r2 = client.post("/quotes/approve-confirm", json={"token": q["token"]})
    assert r2.status_code == 409
    assert r2.json().get("detail") == "invalid_transition"

    # Token vacío -> 400
    r3 = client.post("/quotes/approve-confirm", json={"token": "  "})
    assert r3.status_code == 400
    assert r3.json().get("detail") == "token_required"

    # Token inexistente -> 404
    r4 = client.post("/quotes/approve-confirm", json={"token": "notfound"})
    assert r4.status_code == 404
    assert r4.json().get("detail") == "quote_not_found"


def test_approve_check_with_expired_token_returns_false():
    r = client.post("/quotes/", json={"customer": "Exp", "total": 1})
    assert r.status_code == 200
    q = r.json()
    _expire_token(q["token"])

    r2 = client.post("/quotes/approve-check", json={"token": q["token"]})
    assert r2.status_code == 200
    data = r2.json()
    assert data["ok"] is False
    assert data["quote_id"] is None


def test_approve_confirm_with_expired_token_returns_410():
    r = client.post("/quotes/", json={"customer": "Exp2", "total": 2})
    assert r.status_code == 200
    q = r.json()
    _expire_token(q["token"])

    r2 = client.post("/quotes/approve-confirm", json={"token": q["token"]})
    assert r2.status_code == 410
    assert r2.json().get("detail") == "token_expired"


def test_rate_limit_on_check_and_confirm():
    r = client.post("/quotes/", json={"customer": "RL", "total": 3})
    assert r.status_code == 200
    q = r.json()

    # check: 10 permitidos, el 11 debe 429
    last = None
    for i in range(11):
        last = client.post("/quotes/approve-check", json={"token": q["token"]})
    assert last is not None
    assert last.status_code == 429
    assert last.json().get("detail") == "rate_limited"

    # confirm: 5 permitidos, el 6 debe 429 (si no aprobó antes)
    last2 = None
    for i in range(6):
        last2 = client.post("/quotes/approve-confirm", json={"token": q["token"]})
        if last2.status_code == 200:
            # Si aprobó antes, el siguiente loop intentará de nuevo y esperamos 429 al sexto intento igualmente
            continue
    assert last2 is not None
    assert last2.status_code == 429
    assert last2.json().get("detail") == "rate_limited"
