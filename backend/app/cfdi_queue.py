import json
import os
import logging
import time
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from .models import CfdiPendingORM, CfdiDocumentORM
from .storage import upload_bytes
from .cfdi import _build_xml, _build_pdf, Item

logger = logging.getLogger(__name__)

try:
    import redis
except Exception:  # pragma: no cover
    redis = None

try:
    import fakeredis
except Exception:  # pragma: no cover
    fakeredis = None

_local_queue: list[str] = []

MAX_ATTEMPTS = int(os.getenv("CFDI_MAX_ATTEMPTS", "5"))


def _get_redis():
    url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    if redis is not None:
        try:
            client = redis.from_url(url)
            client.ping()
            return client
        except Exception as exc:  # pragma: no cover
            logger.warning("redis unavailable: %s", exc)
    if fakeredis is not None:
        return fakeredis.FakeStrictRedis()
    return None


redis_client = _get_redis()


def _enqueue(job: dict):
    data = json.dumps(job)
    if redis_client is not None:
        redis_client.rpush("cfdi_queue", data)
    else:
        _local_queue.append(data)


def _dequeue():
    if redis_client is not None:
        item = redis_client.lpop("cfdi_queue")
        if item:
            if isinstance(item, bytes):
                item = item.decode()
            return json.loads(item)
    else:
        if _local_queue:
            data = _local_queue.pop(0)
            return json.loads(data)
    return None


def enqueue_cfdi_draft(db: Session, quote_id: str, customer: str, total: float) -> str:
    row = CfdiPendingORM(quote_id=quote_id, customer=customer, total=total)
    db.add(row)
    db.commit()
    _enqueue({"pending_id": row.id})
    return row.id


def process_cfdi_queue(db: Session, limit: int = 10) -> int:
    processed = 0
    for _ in range(limit):
        job = _dequeue()
        if not job:
            break
        pending = db.get(CfdiPendingORM, job["pending_id"])
        if not pending or pending.status != "pending":
            continue
        pending.attempts += 1
        pending.updated_at = datetime.now(timezone.utc)
        try:
            uuid = uuid4().hex
            item = Item(description="Servicio", quantity=1, unit_price=pending.total)
            xml_content = _build_xml(uuid, pending.customer, [item], pending.total)
            pdf_content = _build_pdf(uuid, pending.customer, pending.total)
            xml_url = upload_bytes(f"cfdi/{uuid}.xml", xml_content, "application/xml")
            pdf_url = upload_bytes(f"cfdi/{uuid}.pdf", pdf_content, "application/pdf")
            doc = CfdiDocumentORM(
                uuid=uuid,
                customer=pending.customer,
                total=pending.total,
                xml_url=xml_url,
                pdf_url=pdf_url,
            )
            db.add(doc)
            pending.status = "sent"
            db.add(pending)
            db.commit()
            processed += 1
        except Exception as exc:  # pragma: no cover
            pending.last_error = str(exc)
            if pending.attempts >= MAX_ATTEMPTS:
                pending.status = "failed"
                logger.error(
                    "cfdi %s failed after %s attempts", pending.id, pending.attempts
                )
                db.add(pending)
                db.commit()
            else:
                logger.warning(
                    "cfdi %s attempt %s failed: %s",
                    pending.id,
                    pending.attempts,
                    exc,
                )
                db.add(pending)
                db.commit()
                delay = min(60, 2 ** pending.attempts)
                time.sleep(delay)
                _enqueue(job)
    return processed
