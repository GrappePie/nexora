from fastapi.testclient import TestClient
from sqlalchemy import select
from backend.app.main import app
from backend.app.db import SessionLocal
from backend.app.models import UserORM
import bcrypt

client = TestClient(app)


def test_signup_creates_user_and_hashes_password():
    r = client.post("/auth/signup", json={"email": "new@example.com", "password": "secret"})
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    with SessionLocal() as db:
        user = db.execute(select(UserORM).where(UserORM.email == "new@example.com")).scalar_one()
        assert bcrypt.checkpw("secret".encode(), user.hashed_password.encode())
