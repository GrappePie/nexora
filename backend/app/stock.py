from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .db import get_db
from .models import StockORM
from .auth import require_roles

router = APIRouter(prefix="/stock", tags=["stock"])


class StockCreate(BaseModel):
    item: str
    quantity: int
    unit_price: float


class StockUpdate(BaseModel):
    item: str | None = None
    quantity: int | None = None
    unit_price: float | None = None


class StockItem(BaseModel):
    id: int
    item: str
    quantity: int
    unit_price: float


@router.get("/", response_model=list[StockItem])
def list_stock(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(StockORM).all()
    return [
        StockItem(id=r.id, item=r.item, quantity=r.quantity, unit_price=r.unit_price)
        for r in rows
    ]


@router.post("/", response_model=StockItem)
def create_stock(
    payload: StockCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = StockORM(item=payload.item, quantity=payload.quantity, unit_price=payload.unit_price)
    db.add(row)
    db.commit()
    db.refresh(row)
    return StockItem(id=row.id, item=row.item, quantity=row.quantity, unit_price=row.unit_price)


@router.put("/{stock_id}", response_model=StockItem)
def update_stock(
    stock_id: int,
    payload: StockUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(StockORM, stock_id)
    if not row:
        raise HTTPException(status_code=404, detail="stock_not_found")
    if payload.item is not None:
        row.item = payload.item
    if payload.quantity is not None:
        row.quantity = payload.quantity
    if payload.unit_price is not None:
        row.unit_price = payload.unit_price
    db.add(row)
    db.commit()
    db.refresh(row)
    return StockItem(id=row.id, item=row.item, quantity=row.quantity, unit_price=row.unit_price)


@router.delete("/{stock_id}", response_model=dict)
def delete_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(StockORM, stock_id)
    if not row:
        raise HTTPException(status_code=404, detail="stock_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}
