from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
from contextlib import asynccontextmanager

from . import auth as auth_router
from . import quotes as quotes_router
from . import cfdi as cfdi_router
from .db import Base, engine, DATABASE_URL


@asynccontextmanager
async def lifespan(app: FastAPI):
    if DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Nexora Core API", version="0.1.1", lifespan=lifespan)

class LicenseStatus(BaseModel):
    status: Literal["valid", "limited", "expired"] = "valid"
    exp: int | None = None

@app.get("/health")
def health():
    return {"ok": True, "service": "core", "version": "0.1.1"}

@app.get("/license/status", response_model=LicenseStatus)
def license_status():
    return LicenseStatus(status="valid", exp=None)

app.include_router(auth_router.router)
app.include_router(quotes_router.router)
app.include_router(cfdi_router.router)
