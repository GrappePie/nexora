import hashlib
import logging
import re
from datetime import datetime, timezone
from uuid import uuid4
from xml.etree.ElementTree import Element, SubElement, tostring
from urllib.parse import urlparse
from urllib.request import url2pathname

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .auth import require_roles
from .db import get_db
from .models import CfdiDocumentORM, TaxConfigORM
from .storage import upload_bytes


router = APIRouter(prefix="/cfdi", tags=["cfdi"])

logger = logging.getLogger(__name__)


class Item(BaseModel):
    description: str
    quantity: int
    unit_price: float


RFC_REGEX = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")
VALID_USOS = {"G01", "G02", "G03", "I01", "I02", "P01"}


def validate_rfc(rfc: str) -> str:
    if not RFC_REGEX.fullmatch(rfc.upper()):
        raise HTTPException(status_code=400, detail="invalid_rfc")
    return rfc.upper()


def validate_cfdi_use(cfdi_use: str) -> str:
    cfdi_use = cfdi_use.upper()
    if cfdi_use not in VALID_USOS:
        raise HTTPException(status_code=400, detail="invalid_cfdi_use")
    return cfdi_use


class CfdiRequest(BaseModel):
    customer: str
    rfc: str
    cfdi_use: str
    items: list[Item]


class CfdiResponse(BaseModel):
    uuid: str
    xml_url: str
    pdf_url: str
    status: str = "sent"


class TaxConfig(BaseModel):
    rfc: str
    provider: str | None = None


def _build_xml(
    uuid: str,
    customer: str,
    items: list[Item],
    total: float,
    rfc: str,
    cfdi_use: str,
) -> bytes:
    sello = hashlib.sha256(uuid.encode()).hexdigest()
    timbre = hashlib.md5(uuid.encode()).hexdigest()
    root = Element(
        "cfdi",
        uuid=uuid,
        customer=customer,
        rfc=rfc,
        uso=cfdi_use,
        total=f"{total:.2f}",
        sello=sello,
        timbre=timbre,
        fecha=datetime.now(timezone.utc).isoformat(),
    )
    for i in items:
        SubElement(
            root,
            "item",
            desc=i.description,
            qty=str(i.quantity),
            price=f"{i.unit_price:.2f}",
        )
    return tostring(root, encoding="utf-8", xml_declaration=True)


def _build_pdf(uuid: str, customer: str, total: float) -> bytes:
    text = f"CFDI {uuid} \nCliente: {customer} \nTotal: {total:.2f}"
    # Minimal PDF with text, enough for tests and manual inspection
    content = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET"
    parts = [
        "%PDF-1.4",
        "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
        "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
        "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
        f"4 0 obj<< /Length {len(content)} >>stream\n{content}\nendstream\nendobj",
        "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
    ]
    xref_positions = []
    offset = 0
    for part in parts:
        xref_positions.append(offset)
        offset += len(part.encode("utf-8")) + 1
    xref_start = offset
    xref = ["xref", "0 6", "0000000000 65535 f "]
    for pos in xref_positions:
        xref.append(f"{pos:010} 00000 n ")
    trailer = "trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n{}\n%%EOF".format(xref_start)
    pdf_bytes = ("\n".join(parts) + "\n" + "\n".join(xref) + "\n" + trailer).encode("utf-8")
    return pdf_bytes


def _serve_url(url: str, filename: str, media_type: str):
    if url.startswith("file://"):
        parsed = urlparse(url)
        # Convert file URI path to a valid local filesystem path across platforms
        path = url2pathname(parsed.path)
        return FileResponse(path, media_type=media_type, filename=filename)
    return RedirectResponse(url)


@router.get("/config", response_model=TaxConfig)
def get_tax_config(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    row = db.get(TaxConfigORM, 1)
    if not row:
        raise HTTPException(status_code=404, detail="config_not_found")
    return TaxConfig(rfc=row.rfc, provider=row.provider)


@router.post("/config", response_model=TaxConfig)
def set_tax_config(
    payload: TaxConfig,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    validate_rfc(payload.rfc)
    row = db.get(TaxConfigORM, 1)
    if not row:
        row = TaxConfigORM(id=1, rfc=payload.rfc.upper(), provider=payload.provider)
    else:
        row.rfc = payload.rfc.upper()
        row.provider = payload.provider
    db.add(row)
    db.commit()
    return payload


@router.post("/", response_model=CfdiResponse)
def generate_cfdi(
    payload: CfdiRequest,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
) -> CfdiResponse:
    logger.info("generate cfdi for %s", payload.customer)
    try:
        uuid = uuid4().hex
        rfc = validate_rfc(payload.rfc)
        cfdi_use = validate_cfdi_use(payload.cfdi_use)
        total = sum(i.quantity * i.unit_price for i in payload.items)
        xml_content = _build_xml(uuid, payload.customer, payload.items, total, rfc, cfdi_use)
        pdf_content = _build_pdf(uuid, payload.customer, total)
        xml_url = upload_bytes(f"cfdi/{uuid}.xml", xml_content, "application/xml")
        pdf_url = upload_bytes(f"cfdi/{uuid}.pdf", pdf_content, "application/pdf")

        row = CfdiDocumentORM(
            uuid=uuid,
            customer=payload.customer,
            total=total,
            xml_url=xml_url,
            pdf_url=pdf_url,
            status="sent",
        )
        db.add(row)
        db.commit()
        return CfdiResponse(uuid=uuid, xml_url=xml_url, pdf_url=pdf_url, status="sent")
    except Exception as exc:  # pragma: no cover
        logger.exception("cfdi generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="cfdi_generation_failed")


@router.get("/{cfdi_uuid}")
def download_cfdi(
    cfdi_uuid: str,
    file: str = Query("xml", pattern="^(xml|pdf)$"),
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    logger.info("download cfdi %s", cfdi_uuid)
    row = db.query(CfdiDocumentORM).filter(CfdiDocumentORM.uuid == cfdi_uuid).first()
    if not row:
        raise HTTPException(status_code=404, detail="cfdi_not_found")
    url = row.xml_url if file == "xml" else row.pdf_url
    media_type = "application/xml" if file == "xml" else "application/pdf"
    filename = f"{cfdi_uuid}.{file}"
    try:
        return _serve_url(url, filename, media_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="file_not_found")
    except Exception as exc:  # pragma: no cover
        logger.exception("error serving cfdi %s: %s", cfdi_uuid, exc)
        raise HTTPException(status_code=500, detail="cfdi_unavailable")


@router.post("/process-pending", response_model=dict)
def process_pending_cfdi(
    limit: int = 10,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_roles(["admin"])),
):
    from .cfdi_queue import process_cfdi_queue
    try:
        processed = process_cfdi_queue(db, limit)
    except Exception as exc:  # pragma: no cover
        logger.exception("error processing cfdi queue: %s", exc)
        raise HTTPException(status_code=500, detail="queue_error")
    return {"processed": processed}
