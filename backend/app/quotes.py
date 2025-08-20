import logging
import time
from collections import deque
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .db import get_db
from .models import QuoteORM

# Rate limiter simple en memoria (clave -> deque de timestamps)
_RATE_BUCKETS: dict[str, deque[float]] = {}

def _rate_allow(key: str, limit: int, window_seconds: int) -> bool:
    now = time.time()
    q = _RATE_BUCKETS.setdefault(key, deque())
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True

router = APIRouter(prefix="/quotes", tags=["quotes"])

logger = logging.getLogger(__name__)

# --- helpers ---

def _as_aware_utc(dt: datetime | None) -> datetime | None:
    """Devuelve el datetime con tz UTC si venía naive (SQLite puede perder tzinfo)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class QuoteCreate(BaseModel):
    customer: str
    total: float

class Quote(BaseModel):
    id: str
    customer: str
    total: float
    status: str = "pending"
    token: str

class ApproveCheckRequest(BaseModel):
    token: str

class ApproveCheckResponse(BaseModel):
    ok: bool
    quote_id: str | None = None

@router.get("/", response_model=list[Quote])
def list_quotes(db: Session = Depends(get_db)):
    logger.info("list quotes")
    rows = db.query(QuoteORM).all()
    return [Quote(id=r.id, customer=r.customer, total=r.total, status=r.status, token=r.token) for r in rows]

@router.post("/", response_model=Quote)
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    logger.info("create quote for %s", payload.customer)
    row = QuoteORM(customer=payload.customer, total=payload.total)
    db.add(row)
    db.commit()
    db.refresh(row)
    return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)

@router.post("/approve-check", response_model=ApproveCheckResponse)
def approve_check(payload: ApproveCheckRequest, db: Session = Depends(get_db)):
    token = payload.token.strip()
    logger.info("approve check %s", token)
    if not token:
        raise HTTPException(status_code=400, detail="token_required")
    if not _rate_allow(f"check:{token}", limit=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="rate_limited")
    row = db.query(QuoteORM).filter(QuoteORM.token == token).first()
    if not row:
        return ApproveCheckResponse(ok=False, quote_id=None)
    # Expirado: tratar como inválido en el check
    now = datetime.now(timezone.utc)
    expires_at = _as_aware_utc(row.token_expires_at)
    if expires_at is not None and expires_at < now:
        return ApproveCheckResponse(ok=False, quote_id=None)
    return ApproveCheckResponse(ok=True, quote_id=row.id)

@router.post("/approve-confirm", response_model=Quote)
def approve_confirm(payload: ApproveCheckRequest, db: Session = Depends(get_db)):
    token = payload.token.strip()
    logger.info("approve confirm %s", token)
    if not token:
        raise HTTPException(status_code=400, detail="token_required")
    if not _rate_allow(f"confirm:{token}", limit=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="rate_limited")
    row = db.query(QuoteORM).filter(QuoteORM.token == token).first()
    if not row:
        raise HTTPException(status_code=404, detail="quote_not_found")
    now = datetime.now(timezone.utc)
    expires_at = _as_aware_utc(row.token_expires_at)
    if expires_at is not None and expires_at < now:
        raise HTTPException(status_code=410, detail="token_expired")
    if row.status == "approved":
        return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)
    if row.status == "rejected":
        raise HTTPException(status_code=409, detail="invalid_transition")
    row.status = "approved"
    db.add(row)
    db.commit()
    db.refresh(row)
    return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)

@router.post("/{quote_id}/approve", response_model=Quote)
def approve_quote(quote_id: str, db: Session = Depends(get_db)):
    logger.info("approve quote %s", quote_id)
    row = db.query(QuoteORM).filter(QuoteORM.id == quote_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="quote_not_found")
    if row.status == "approved":
        return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)
    if row.status == "rejected":
        raise HTTPException(status_code=409, detail="invalid_transition")
    row.status = "approved"
    db.add(row)
    db.commit()
    db.refresh(row)
    return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)

@router.post("/{quote_id}/reject", response_model=Quote)
def reject_quote(quote_id: str, db: Session = Depends(get_db)):
    logger.info("reject quote %s", quote_id)
    row = db.query(QuoteORM).filter(QuoteORM.id == quote_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="quote_not_found")
    if row.status == "rejected":
        return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)
    if row.status == "approved":
        raise HTTPException(status_code=409, detail="invalid_transition")
    row.status = "rejected"
    db.add(row)
    db.commit()
    db.refresh(row)
    return Quote(id=row.id, customer=row.customer, total=row.total, status=row.status, token=row.token)
