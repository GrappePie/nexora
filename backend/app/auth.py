from datetime import datetime, timedelta, timezone
from uuid import uuid4

import logging
import bcrypt

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import get_db
from .models import UserORM
from .email import send_email

SECRET = "dev_secret_change_me"
ALGO = "HS256"

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    exp: int
    roles: list[str] = []


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


bearer = HTTPBearer(auto_error=False)


def require_roles(required: list[str]):
    """Dependency factory that ensures JWT contains at least one of the required roles."""

    def _verify(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
        if not credentials:
            raise HTTPException(status_code=401, detail="unauthorized")
        token = credentials.credentials
        try:
            claims = jwt.decode(token, SECRET, algorithms=[ALGO])
        except JWTError:
            raise HTTPException(status_code=401, detail="invalid_token")
        roles = claims.get("roles", [])
        if not any(r in roles for r in required):
            raise HTTPException(status_code=403, detail="forbidden")
        return claims

    return _verify


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    logger.info("login attempt for %s", payload.email)
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


@router.post("/signup", response_model=LoginResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info("signup attempt for %s", payload.email)
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="user_exists")
    user = UserORM(email=payload.email.lower(), hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
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


@router.post("/refresh", response_model=LoginResponse)
def refresh(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="unauthorized")
    token = credentials.credentials
    try:
        claims = jwt.decode(token, SECRET, algorithms=[ALGO])
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid_token")
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(hours=8)
    new_claims = {
        "sub": claims.get("sub"),
        "roles": claims.get("roles", []),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    new_token = jwt.encode(new_claims, SECRET, algorithm=ALGO)
    return LoginResponse(access_token=new_token, exp=new_claims["exp"], roles=new_claims["roles"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    logger.info("forgot password for %s", payload.email)
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    token = uuid4().hex
    user.reset_token = token
    user.reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    link = f"https://example.com/reset-password/{token}"
    send_email(user.email, "Password reset", f"Reset link: {link}")
    return {"message": "ok"}


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    logger.info("reset password token %s", payload.token)
    stmt = select(UserORM).where(UserORM.reset_token == payload.token)
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not user.reset_expires:
        raise HTTPException(status_code=400, detail="invalid_token")
    expires = user.reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="invalid_token")
    user.hashed_password = hash_password(payload.password)
    user.reset_token = None
    user.reset_expires = None
    db.commit()
    return {"message": "password_reset"}


class VerifyEmailRequest(BaseModel):
    email: EmailStr


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    logger.info("verify email for %s", payload.email)
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    user.is_verified = True
    db.commit()
    return {"message": "verified"}

