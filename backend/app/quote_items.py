from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import QuoteItemORM
from .auth import require_roles


router = APIRouter(prefix="/quote-items", tags=["quote_items"])


class QuoteItemCreate(BaseModel):
    quote_id: str
    description: str
    qty: int
    unit_price: float
    tax_rate: float = 0.0


class QuoteItemUpdate(BaseModel):
    description: str | None = None
    qty: int | None = None
    unit_price: float | None = None
    tax_rate: float | None = None
    is_approved: bool | None = None


class QuoteItem(BaseModel):
    id: int
    quote_id: str
    description: str
    qty: int
    unit_price: float
    tax_rate: float
    is_approved: bool


@router.get("/", response_model=list[QuoteItem])
def list_items(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(QuoteItemORM).all()
    return [
        QuoteItem(
            id=r.id,
            quote_id=r.quote_id,
            description=r.description,
            qty=r.qty,
            unit_price=r.unit_price,
            tax_rate=r.tax_rate,
            is_approved=r.is_approved,
        )
        for r in rows
    ]


@router.post("/", response_model=QuoteItem)
def create_item(
    payload: QuoteItemCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = QuoteItemORM(
        quote_id=payload.quote_id,
        description=payload.description,
        qty=payload.qty,
        unit_price=payload.unit_price,
        tax_rate=payload.tax_rate,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return QuoteItem(
        id=row.id,
        quote_id=row.quote_id,
        description=row.description,
        qty=row.qty,
        unit_price=row.unit_price,
        tax_rate=row.tax_rate,
        is_approved=row.is_approved,
    )


@router.put("/{item_id}", response_model=QuoteItem)
def update_item(
    item_id: int,
    payload: QuoteItemUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(QuoteItemORM, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="quote_item_not_found")
    if payload.description is not None:
        row.description = payload.description
    if payload.qty is not None:
        row.qty = payload.qty
    if payload.unit_price is not None:
        row.unit_price = payload.unit_price
    if payload.tax_rate is not None:
        row.tax_rate = payload.tax_rate
    if payload.is_approved is not None:
        row.is_approved = payload.is_approved
    db.add(row)
    db.commit()
    db.refresh(row)
    return QuoteItem(
        id=row.id,
        quote_id=row.quote_id,
        description=row.description,
        qty=row.qty,
        unit_price=row.unit_price,
        tax_rate=row.tax_rate,
        is_approved=row.is_approved,
    )


@router.delete("/{item_id}", response_model=dict)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(QuoteItemORM, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="quote_item_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

