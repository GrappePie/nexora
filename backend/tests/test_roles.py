from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.auth import create_access_token
from backend.app.db import SessionLocal
from backend.app.models import UserORM

client = TestClient(app)


def test_signup_assigns_user_role_by_default():
    r = client.post("/auth/signup", json={"email": "role1@example.com", "password": "secret"})
    assert r.status_code == 201
    data = r.json()
    assert "user" in data.get("roles", [])
    with SessionLocal() as db:
        user = db.query(UserORM).filter_by(email="role1@example.com").one()
        assert any(r.name == "user" for r in user.roles)


def test_admin_can_add_and_remove_role():
    client.post("/auth/signup", json={"email": "role2@example.com", "password": "secret"})
    token, _ = create_access_token("admin@example.com", ["admin"])
    headers = {"Authorization": f"Bearer {token}"}
    add = client.post(
        "/auth/roles",
        json={"email": "role2@example.com", "role": "viewer"},
        headers=headers,
    )
    assert add.status_code == 200
    assert "viewer" in add.json()["roles"]
    rem = client.request(
        "DELETE",
        "/auth/roles",
        json={"email": "role2@example.com", "role": "viewer"},
        headers=headers,
    )
    assert rem.status_code == 200
    assert "viewer" not in rem.json()["roles"]


def test_non_admin_cannot_modify_roles():
    client.post("/auth/signup", json={"email": "role3@example.com", "password": "secret"})
    token, _ = create_access_token("user@example.com", ["user"])
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post(
        "/auth/roles",
        json={"email": "role3@example.com", "role": "viewer"},
        headers=headers,
    )
    assert r.status_code == 403


def test_get_roles_returns_current_user_roles():
    signup = client.post("/auth/signup", json={"email": "role4@example.com", "password": "secret"})
    token = signup.json()["access_token"]
    resp = client.get("/auth/roles", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["roles"] == ["user"]
