import json
import logging
import os

from fastapi import FastAPI, Request, Response
from pydantic import BaseModel
from typing import Literal
from contextlib import asynccontextmanager

from prometheus_client import Counter, CONTENT_TYPE_LATEST, generate_latest

from . import auth as auth_router
from . import quotes as quotes_router
from . import cfdi as cfdi_router
from . import billing as billing_router
from . import stock as stock_router
from . import invoice as invoice_router
from . import customers as customers_router
from . import vehicles as vehicles_router
from . import quote_items as quote_items_router
from . import work_orders as work_orders_router
from . import attachments as attachments_router
from . import license_state as license_state_router
from .db import Base, engine, DATABASE_URL


LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
METRICS_ENDPOINT = os.getenv("METRICS_ENDPOINT", "/metrics")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.basicConfig(level=LOG_LEVEL, handlers=[handler])
logger = logging.getLogger(__name__)


REQUEST_COUNTER = Counter("http_requests_total", "Total HTTP requests")


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
    logger.info("health_check")
    return {"ok": True, "service": "core", "version": "0.1.1"}

@app.get("/license/status", response_model=LicenseStatus)
def license_status():
    logger.info("license_status")
    return LicenseStatus(status="valid", exp=None)


@app.middleware("http")
async def _metrics_middleware(request: Request, call_next):
    response = await call_next(request)
    REQUEST_COUNTER.inc()
    return response


@app.get(METRICS_ENDPOINT)
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

app.include_router(auth_router.router)
app.include_router(quotes_router.router)
app.include_router(cfdi_router.router)
app.include_router(billing_router.router)
app.include_router(stock_router.router)
app.include_router(invoice_router.router)
app.include_router(customers_router.router)
app.include_router(vehicles_router.router)
app.include_router(quote_items_router.router)
app.include_router(work_orders_router.router)
app.include_router(attachments_router.router)
app.include_router(license_state_router.router)
