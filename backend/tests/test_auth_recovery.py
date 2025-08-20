from fastapi.testclient import TestClient
from sqlalchemy import select
from backend.app.main import app
from backend.app.db import SessionLocal
from backend.app.models import UserORM
import hashlib

client = TestClient(app)


def _get_user():
    with SessionLocal() as db:
        return db.execute(select(UserORM).where(UserORM.email == "admin@example.com")).scalar_one()


def test_password_recovery_flow():
    r = client.post("/auth/forgot-password", json={"email": "admin@example.com"})
    assert r.status_code == 200
    user = _get_user()
    assert user.reset_token is not None

    r2 = client.post("/auth/reset-password", json={"token": user.reset_token, "password": "newpass"})
    assert r2.status_code == 200
    user2 = _get_user()
    assert user2.reset_token is None
    assert user2.hashed_password == hashlib.sha256("newpass".encode()).hexdigest()


def test_verify_email():
    r = client.post("/auth/verify-email", json={"email": "admin@example.com"})
    assert r.status_code == 200
    user = _get_user()
    assert user.is_verified is True


def test_login_invalid_credentials_returns_401():
    r = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )
    assert r.status_code == 401
    assert r.json().get("detail") == "invalid_credentials"


def test_forgot_password_unknown_email_returns_404():
    r = client.post("/auth/forgot-password", json={"email": "nope@example.com"})
    assert r.status_code == 404
    assert r.json().get("detail") == "user_not_found"
