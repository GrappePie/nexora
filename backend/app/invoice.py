from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .db import get_db
from .models import InvoiceORM
from .auth import require_roles

router = APIRouter(prefix="/invoices", tags=["invoices"])


class InvoiceCreate(BaseModel):
    customer: str
    total: float


class InvoiceUpdate(BaseModel):
    customer: str | None = None
    total: float | None = None


class Invoice(BaseModel):
    id: int
    customer: str
    total: float
    created_at: datetime | None = None


@router.get("/", response_model=list[Invoice])
def list_invoices(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(InvoiceORM).all()
    return [
        Invoice(id=r.id, customer=r.customer, total=r.total, created_at=r.created_at)
        for r in rows
    ]


@router.post("/", response_model=Invoice)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = InvoiceORM(customer=payload.customer, total=payload.total)
    db.add(row)
    db.commit()
    db.refresh(row)
    return Invoice(id=row.id, customer=row.customer, total=row.total, created_at=row.created_at)


@router.get("/{invoice_id}", response_model=Invoice)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(InvoiceORM, invoice_id)
    if not row:
        raise HTTPException(status_code=404, detail="invoice_not_found")
    return Invoice(id=row.id, customer=row.customer, total=row.total, created_at=row.created_at)


@router.put("/{invoice_id}", response_model=Invoice)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(InvoiceORM, invoice_id)
    if not row:
        raise HTTPException(status_code=404, detail="invoice_not_found")
    if payload.customer is not None:
        row.customer = payload.customer
    if payload.total is not None:
        row.total = payload.total
    db.add(row)
    db.commit()
    db.refresh(row)
    return Invoice(id=row.id, customer=row.customer, total=row.total, created_at=row.created_at)


@router.delete("/{invoice_id}", response_model=dict)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(InvoiceORM, invoice_id)
    if not row:
        raise HTTPException(status_code=404, detail="invoice_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}
