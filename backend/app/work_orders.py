from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import WorkOrderORM
from .auth import require_roles


router = APIRouter(prefix="/work-orders", tags=["work_orders"])


class WorkOrderCreate(BaseModel):
    quote_id: str | None = None
    status: str = "open"


class WorkOrderUpdate(BaseModel):
    quote_id: str | None = None
    status: str | None = None


class WorkOrder(BaseModel):
    id: str
    quote_id: str | None
    status: str


@router.get("/", response_model=list[WorkOrder])
def list_work_orders(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(WorkOrderORM).all()
    return [WorkOrder(id=r.id, quote_id=r.quote_id, status=r.status) for r in rows]


@router.post("/", response_model=WorkOrder)
def create_work_order(
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = WorkOrderORM(quote_id=payload.quote_id, status=payload.status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return WorkOrder(id=row.id, quote_id=row.quote_id, status=row.status)


@router.put("/{wo_id}", response_model=WorkOrder)
def update_work_order(
    wo_id: str,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(WorkOrderORM, wo_id)
    if not row:
        raise HTTPException(status_code=404, detail="work_order_not_found")
    if payload.quote_id is not None:
        row.quote_id = payload.quote_id
    if payload.status is not None:
        row.status = payload.status
    db.add(row)
    db.commit()
    db.refresh(row)
    return WorkOrder(id=row.id, quote_id=row.quote_id, status=row.status)


@router.delete("/{wo_id}", response_model=dict)
def delete_work_order(
    wo_id: str,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(WorkOrderORM, wo_id)
    if not row:
        raise HTTPException(status_code=404, detail="work_order_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

