from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from backend.app.main import app
from backend.app.auth import SECRET, ALGO
from backend.app.db import SessionLocal
from backend.app.models import CfdiPendingORM, CfdiDocumentORM
import backend.app.cfdi_queue as cfdi_queue


def _auth_headers():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"sub": "tester", "roles": ["admin"], "exp": int((now + timedelta(hours=1)).timestamp())},
        SECRET,
        algorithm=ALGO,
    )
    return {"Authorization": f"Bearer {token}"}


def test_quote_approval_enqueue_and_process(tmp_path, monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    monkeypatch.setenv("REDIS_URL", "")
    monkeypatch.setenv("PAC_PROVIDER", "sandbox")
    monkeypatch.setenv("PAC_USER", "demo")
    monkeypatch.setenv("PAC_PASS", "demo")
    cfdi_queue.redis_client = cfdi_queue._get_redis()
    cfdi_queue._local_queue.clear()

    client = TestClient(app)
    headers = _auth_headers()
    # create quote
    r = client.post("/quotes/", json={"customer": "ACME", "total": 50}, headers=headers)
    assert r.status_code == 200
    q = r.json()
    # approve quote triggers enqueue
    r2 = client.post(f"/quotes/{q['id']}/approve", headers=headers)
    assert r2.status_code == 200

    with SessionLocal() as db:
        pending = db.query(CfdiPendingORM).filter(CfdiPendingORM.quote_id == q["id"]).first()
        assert pending is not None
        assert pending.status == "pending"

    # process pending cfdi
    r3 = client.post("/cfdi/process-pending", headers=headers)
    assert r3.status_code == 200
    assert r3.json()["processed"] >= 1

    with SessionLocal() as db:
        pending2 = db.query(CfdiPendingORM).filter(CfdiPendingORM.quote_id == q["id"]).first()
        assert pending2.status == "sent"
        doc = db.query(CfdiDocumentORM).filter(CfdiDocumentORM.customer == "ACME").first()
        assert doc is not None
        assert doc.status == "sent"
        xml_path = Path(urlparse(doc.xml_url).path)
        pdf_path = Path(urlparse(doc.pdf_url).path)
        assert xml_path.exists()
        assert pdf_path.exists()


def test_enqueue_invalid_rfc_raises(monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", "/tmp")
    monkeypatch.setenv("REDIS_URL", "")
    cfdi_queue.redis_client = cfdi_queue._get_redis()
    cfdi_queue._local_queue.clear()
    with SessionLocal() as db:
        with pytest.raises(Exception):
            cfdi_queue.enqueue_cfdi_draft(db, "q1", "ACME", 10.0, rfc="BAD", cfdi_use="P01")
