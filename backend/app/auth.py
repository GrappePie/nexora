from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from jose import jwt

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

# Nota: hardcoded demo user. Sustituir por consulta a DB.
_DEMO_USER = {
    "email": "admin@example.com",
    "password": "admin",
    "roles": ["admin"],
}

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if payload.email.lower() != _DEMO_USER["email"] or payload.password != _DEMO_USER["password"]:
        raise HTTPException(status_code=401, detail="invalid_credentials")
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(hours=8)
    claims = {
        "sub": payload.email,
        "roles": _DEMO_USER["roles"],
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(claims, SECRET, algorithm=ALGO)
    return LoginResponse(access_token=token, exp=claims["exp"], roles=_DEMO_USER["roles"])

