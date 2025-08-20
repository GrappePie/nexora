from datetime import datetime, timedelta, timezone

from backend.app.db import SessionLocal
from backend.app.models import CfdiPendingORM
import backend.app.cfdi_queue as cfdi_queue


def test_cfdi_queue_marks_failed_after_max_attempts(tmp_path, monkeypatch):
    monkeypatch.setenv("S3_ENDPOINT", "")
    monkeypatch.setenv("S3_LOCAL_DIR", str(tmp_path))
    monkeypatch.setenv("REDIS_URL", "")
    cfdi_queue.redis_client = cfdi_queue._get_redis()
    cfdi_queue.MAX_ATTEMPTS = 2
    cfdi_queue._local_queue.clear()

    # enqueue a pending cfdi
    with SessionLocal() as db:
        pending_id = cfdi_queue.enqueue_cfdi_draft(db, "q1", "ACME", 10.0)

    # force failure
    monkeypatch.setattr(cfdi_queue, "upload_bytes", lambda *a, **k: (_ for _ in ()).throw(Exception("oops")))
    monkeypatch.setattr(cfdi_queue, "time", type("T", (), {"sleep": lambda *_: None})())

    with SessionLocal() as db:
        cfdi_queue.process_cfdi_queue(db, limit=1)
        pending = db.get(CfdiPendingORM, pending_id)
        assert pending.status == "pending"
        cfdi_queue.process_cfdi_queue(db, limit=1)
        pending = db.get(CfdiPendingORM, pending_id)
        assert pending.status == "failed"
