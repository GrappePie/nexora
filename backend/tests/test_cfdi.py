from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt

from backend.app.main import app
from backend.app.auth import SECRET, ALGO
import os


def test_generate_cfdi(tmp_path, monkeypatch):
    # use local storage dir
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    client = TestClient(app)
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"sub": "tester", "roles": ["admin"], "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "customer": "ACME",
        "items": [{"description": "Servicio", "quantity": 1, "unit_price": 100.0}],
    }
    resp = client.post("/cfdi/", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["uuid"]
    assert data["status"] == "generated"
    assert data["xml_url"].startswith("file://")
    assert data["pdf_url"].startswith("file://")
