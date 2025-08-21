from datetime import datetime, timedelta, timezone
from uuid import uuid4

import logging
import os
import bcrypt

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import get_db
from .models import UserORM, RoleORM
from .email import send_email

SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
ALGO = os.getenv("JWT_ALGO", "HS256")

ROLE_MATRIX: dict[str, str] = {
    "admin": "Gestión completa y operaciones críticas",
    "user": "Operaciones estándar en la PWA",
    "viewer": "Acceso de solo lectura a paneles e informes",
}

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger(__name__)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    roles: list[str] | None = None


class RoleRequest(BaseModel):
    email: EmailStr
    role: str


class RolesResponse(BaseModel):
    roles: list[str]

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    exp: int
    roles: list[str] = []


def _build_claims(sub: str, roles: list[str], expires: timedelta) -> dict:
    """Helper to create standard JWT claims."""
    now = datetime.now(tz=timezone.utc)
    exp = now + expires
    return {
        "sub": sub,
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }


def create_access_token(sub: str, roles: list[str], expires: timedelta | None = None) -> tuple[str, int]:
    """Generate a signed JWT for the given subject and roles."""
    expires = expires or timedelta(hours=8)
    claims = _build_claims(sub, roles, expires)
    token = jwt.encode(claims, SECRET, algorithm=ALGO)
    return token, claims["exp"]


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT, returning its claims."""
    try:
        claims = jwt.decode(token, SECRET, algorithms=[ALGO])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="invalid_token") from exc
    roles = claims.get("roles")
    if not isinstance(roles, list):
        claims["roles"] = []
    return claims


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
        claims = decode_access_token(token)
        roles = claims.get("roles", [])
        if not any(r in roles for r in required):
            raise HTTPException(status_code=403, detail="forbidden")
        return claims

    return _verify


def require_auth(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    """Ensure request contains a valid JWT and return its claims."""
    if not credentials:
        raise HTTPException(status_code=401, detail="unauthorized")
    token = credentials.credentials
    return decode_access_token(token)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    logger.info("login attempt for %s", payload.email)
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    roles = [r.name for r in user.roles]
    token, exp = create_access_token(payload.email, roles)
    return LoginResponse(access_token=token, exp=exp, roles=roles)


@router.post("/signup", response_model=LoginResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info("signup attempt for %s", payload.email)
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="user_exists")
    desired_roles = payload.roles or ["user"]
    role_objs: list[RoleORM] = []
    for name in desired_roles:
        role = db.execute(select(RoleORM).where(RoleORM.name == name)).scalar_one_or_none()
        if not role:
            role = RoleORM(name=name)
            db.add(role)
        role_objs.append(role)
    user = UserORM(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        roles=role_objs,
    )
    db.add(user)
    db.commit()
    roles = [r.name for r in user.roles]
    token, exp = create_access_token(payload.email, roles)
    return LoginResponse(access_token=token, exp=exp, roles=roles)


@router.post("/refresh", response_model=LoginResponse)
def refresh(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="unauthorized")
    token = credentials.credentials
    claims = decode_access_token(token)
    sub = claims.get("sub", "")
    roles: list[str] = []
    if sub:
        stmt = select(UserORM).where(func.lower(UserORM.email) == sub.lower())
        user = db.execute(stmt).scalar_one_or_none()
        if user:
            roles = [r.name for r in user.roles]
    if not roles:
        roles = claims.get("roles", [])
    new_token, exp = create_access_token(sub, roles)
    return LoginResponse(access_token=new_token, exp=exp, roles=roles)


@router.get("/roles", response_model=RolesResponse)
def get_roles(claims: dict = Depends(require_auth)):
    roles = claims.get("roles", [])
    return RolesResponse(roles=roles)


@router.post("/roles", response_model=RolesResponse)
def add_role(
    payload: RoleRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    role = db.execute(select(RoleORM).where(RoleORM.name == payload.role)).scalar_one_or_none()
    if not role:
        role = RoleORM(name=payload.role)
        db.add(role)
    if role not in user.roles:
        user.roles.append(role)
    db.commit()
    return RolesResponse(roles=[r.name for r in user.roles])


@router.delete("/roles", response_model=RolesResponse)
def remove_role(
    payload: RoleRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    stmt = select(UserORM).where(func.lower(UserORM.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    role = db.execute(select(RoleORM).where(RoleORM.name == payload.role)).scalar_one_or_none()
    if role and role in user.roles:
        user.roles.remove(role)
    db.commit()
    return RolesResponse(roles=[r.name for r in user.roles])


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

