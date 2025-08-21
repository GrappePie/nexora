from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .models import LicenseStateORM
from .auth import require_roles


router = APIRouter(prefix="/license-state", tags=["license_state"])


class LicenseStateCreate(BaseModel):
    license_key: str | None = None
    is_limited: bool = False


class LicenseStateUpdate(BaseModel):
    license_key: str | None = None
    is_limited: bool | None = None
    last_check: int | None = None


class LicenseState(BaseModel):
    id: int
    license_key: str | None
    is_limited: bool
    last_check: str | None = None


@router.get("/", response_model=list[LicenseState])
def list_states(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    rows = db.query(LicenseStateORM).all()
    return [
        LicenseState(
            id=r.id,
            license_key=r.license_key,
            is_limited=r.is_limited,
            last_check=r.last_check.isoformat() if r.last_check else None,
        )
        for r in rows
    ]


@router.post("/", response_model=LicenseState)
def create_state(
    payload: LicenseStateCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = LicenseStateORM(license_key=payload.license_key, is_limited=payload.is_limited)
    db.add(row)
    db.commit()
    db.refresh(row)
    return LicenseState(
        id=row.id,
        license_key=row.license_key,
        is_limited=row.is_limited,
        last_check=row.last_check.isoformat() if row.last_check else None,
    )


@router.put("/{state_id}", response_model=LicenseState)
def update_state(
    state_id: int,
    payload: LicenseStateUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(LicenseStateORM, state_id)
    if not row:
        raise HTTPException(status_code=404, detail="license_state_not_found")
    if payload.license_key is not None:
        row.license_key = payload.license_key
    if payload.is_limited is not None:
        row.is_limited = payload.is_limited
    if payload.last_check is not None:
        from datetime import datetime, timezone

        row.last_check = datetime.fromtimestamp(payload.last_check, timezone.utc)
    db.add(row)
    db.commit()
    db.refresh(row)
    return LicenseState(
        id=row.id,
        license_key=row.license_key,
        is_limited=row.is_limited,
        last_check=row.last_check.isoformat() if row.last_check else None,
    )


@router.delete("/{state_id}", response_model=dict)
def delete_state(
    state_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(LicenseStateORM, state_id)
    if not row:
        raise HTTPException(status_code=404, detail="license_state_not_found")
    db.delete(row)
    db.commit()
    return {"deleted": True}

