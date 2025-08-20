from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from jose import jwt
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import get_db
from .models import UserORM
import hashlib

SECRET = "dev_secret_change_me"
ALGO = "HS256"

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    exp: int
    roles: list[str] = []

def verify_password(password: str, hashed: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    roles = [r.name for r in user.roles]
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(hours=8)
    claims = {
        "sub": payload.email,
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(claims, SECRET, algorithm=ALGO)
    return LoginResponse(access_token=token, exp=claims["exp"], roles=roles)

