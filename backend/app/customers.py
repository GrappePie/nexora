from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import CustomerORM
from .auth import require_roles


router = APIRouter(prefix="/customers", tags=["customers"])


class CustomerCreate(BaseModel):
    name: str
    rfc: str
    email: str | None = None
    phone: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    rfc: str | None = None
    email: str | None = None
    phone: str | None = None


class Customer(BaseModel):
    id: int
    name: str
    rfc: str
    email: str | None
    phone: str | None


@router.get("/", response_model=list[Customer])
def list_customers(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(CustomerORM).all()
    return [
        Customer(id=r.id, name=r.name, rfc=r.rfc, email=r.email, phone=r.phone)
        for r in rows
    ]


@router.post("/", response_model=Customer)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = CustomerORM(name=payload.name, rfc=payload.rfc, email=payload.email, phone=payload.phone)
    db.add(row)
    db.commit()
    db.refresh(row)
    return Customer(id=row.id, name=row.name, rfc=row.rfc, email=row.email, phone=row.phone)


@router.put("/{customer_id}", response_model=Customer)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(CustomerORM, customer_id)
    if not row:
        raise HTTPException(status_code=404, detail="customer_not_found")
    if payload.name is not None:
        row.name = payload.name
    if payload.rfc is not None:
        row.rfc = payload.rfc
    if payload.email is not None:
        row.email = payload.email
    if payload.phone is not None:
        row.phone = payload.phone
    db.add(row)
    db.commit()
    db.refresh(row)
    return Customer(id=row.id, name=row.name, rfc=row.rfc, email=row.email, phone=row.phone)


@router.delete("/{customer_id}", response_model=dict)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(CustomerORM, customer_id)
    if not row:
        raise HTTPException(status_code=404, detail="customer_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

