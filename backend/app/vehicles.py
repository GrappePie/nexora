from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import VehicleORM
from .auth import require_roles


router = APIRouter(prefix="/vehicles", tags=["vehicles"])


class VehicleCreate(BaseModel):
    customer_id: int
    plates: str
    vin: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None


class VehicleUpdate(BaseModel):
    customer_id: int | None = None
    plates: str | None = None
    vin: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None


class Vehicle(BaseModel):
    id: int
    customer_id: int
    plates: str
    vin: str | None
    make: str | None
    model: str | None
    year: int | None


@router.get("/", response_model=list[Vehicle])
def list_vehicles(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(VehicleORM).all()
    return [
        Vehicle(
            id=r.id,
            customer_id=r.customer_id,
            plates=r.plates,
            vin=r.vin,
            make=r.make,
            model=r.model,
            year=r.year,
        )
        for r in rows
    ]


@router.post("/", response_model=Vehicle)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = VehicleORM(
        customer_id=payload.customer_id,
        plates=payload.plates,
        vin=payload.vin,
        make=payload.make,
        model=payload.model,
        year=payload.year,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return Vehicle(
        id=row.id,
        customer_id=row.customer_id,
        plates=row.plates,
        vin=row.vin,
        make=row.make,
        model=row.model,
        year=row.year,
    )


@router.put("/{vehicle_id}", response_model=Vehicle)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(VehicleORM, vehicle_id)
    if not row:
        raise HTTPException(status_code=404, detail="vehicle_not_found")
    if payload.customer_id is not None:
        row.customer_id = payload.customer_id
    if payload.plates is not None:
        row.plates = payload.plates
    if payload.vin is not None:
        row.vin = payload.vin
    if payload.make is not None:
        row.make = payload.make
    if payload.model is not None:
        row.model = payload.model
    if payload.year is not None:
        row.year = payload.year
    db.add(row)
    db.commit()
    db.refresh(row)
    return Vehicle(
        id=row.id,
        customer_id=row.customer_id,
        plates=row.plates,
        vin=row.vin,
        make=row.make,
        model=row.model,
        year=row.year,
    )


@router.delete("/{vehicle_id}", response_model=dict)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(VehicleORM, vehicle_id)
    if not row:
        raise HTTPException(status_code=404, detail="vehicle_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

