from fastapi.testclient import TestClient
from backend.app.main import app
import os


def test_generate_cfdi(tmp_path, monkeypatch):
    # use local storage dir
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    client = TestClient(app)
    payload = {
        "customer": "ACME",
        "items": [{"description": "Servicio", "quantity": 1, "unit_price": 100.0}],
    }
    resp = client.post("/cfdi/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["uuid"]
    assert data["status"] == "generated"
    assert data["xml_url"].startswith("file://")
    assert data["pdf_url"].startswith("file://")
