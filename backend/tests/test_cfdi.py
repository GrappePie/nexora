from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from jose import jwt

from backend.app.main import app
from backend.app.auth import SECRET, ALGO
import os


def _auth_headers():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"sub": "tester", "roles": ["admin"], "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )
    return {"Authorization": f"Bearer {token}"}


def test_generate_cfdi(tmp_path, monkeypatch):
    # use local storage dir
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    client = TestClient(app)
    headers = _auth_headers()
    payload = {
        "customer": "ACME",
        "rfc": "XAXX010101000",
        "cfdi_use": "P01",
        "items": [{"description": "Servicio", "quantity": 1, "unit_price": 100.0}],
    }
    resp = client.post("/cfdi/", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["uuid"]
    assert data["status"] == "sent"
    assert data["xml_url"].startswith("file://")
    assert data["pdf_url"].startswith("file://")

    cfdi_uuid = data["uuid"]
    resp_xml = client.get(f"/cfdi/{cfdi_uuid}?file=xml", headers=headers)
    assert resp_xml.status_code == 200
    assert resp_xml.headers["content-type"] == "application/xml"
    assert b"<?xml" in resp_xml.content

    resp_pdf = client.get(f"/cfdi/{cfdi_uuid}?file=pdf", headers=headers)
    assert resp_pdf.status_code == 200
    assert resp_pdf.headers["content-type"] == "application/pdf"
    assert resp_pdf.content.startswith(b"%PDF")


def test_download_cfdi_not_found_returns_404(tmp_path, monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    client = TestClient(app)
    headers = _auth_headers()
    resp = client.get("/cfdi/nope", headers=headers)
    assert resp.status_code == 404
    assert resp.json().get("detail") == "cfdi_not_found"
