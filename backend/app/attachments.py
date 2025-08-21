from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import AttachmentORM
from .auth import require_roles


router = APIRouter(prefix="/attachments", tags=["attachments"])


class AttachmentCreate(BaseModel):
    work_order_id: str
    s3_key: str


class AttachmentUpdate(BaseModel):
    work_order_id: str | None = None
    s3_key: str | None = None


class Attachment(BaseModel):
    id: int
    work_order_id: str
    s3_key: str


@router.get("/", response_model=list[Attachment])
def list_attachments(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(AttachmentORM).all()
    return [Attachment(id=r.id, work_order_id=r.work_order_id, s3_key=r.s3_key) for r in rows]


@router.post("/", response_model=Attachment)
def create_attachment(
    payload: AttachmentCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = AttachmentORM(work_order_id=payload.work_order_id, s3_key=payload.s3_key)
    db.add(row)
    db.commit()
    db.refresh(row)
    return Attachment(id=row.id, work_order_id=row.work_order_id, s3_key=row.s3_key)


@router.put("/{attachment_id}", response_model=Attachment)
def update_attachment(
    attachment_id: int,
    payload: AttachmentUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(AttachmentORM, attachment_id)
    if not row:
        raise HTTPException(status_code=404, detail="attachment_not_found")
    if payload.work_order_id is not None:
        row.work_order_id = payload.work_order_id
    if payload.s3_key is not None:
        row.s3_key = payload.s3_key
    db.add(row)
    db.commit()
    db.refresh(row)
    return Attachment(id=row.id, work_order_id=row.work_order_id, s3_key=row.s3_key)


@router.delete("/{attachment_id}", response_model=dict)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(AttachmentORM, attachment_id)
    if not row:
        raise HTTPException(status_code=404, detail="attachment_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

