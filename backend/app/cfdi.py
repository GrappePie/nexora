from fastapi import APIRouter, Depends
from pydantic import BaseModel
from uuid import uuid4

from .storage import upload_bytes
from .auth import require_roles

router = APIRouter(prefix="/cfdi", tags=["cfdi"])


class Item(BaseModel):
    description: str
    quantity: int
    unit_price: float


class CfdiRequest(BaseModel):
    customer: str
    items: list[Item]


class CfdiResponse(BaseModel):
    uuid: str
    xml_url: str
    pdf_url: str
    status: str = "generated"


@router.post("/", response_model=CfdiResponse)
def generate_cfdi(
    payload: CfdiRequest,
    claims: dict = Depends(require_roles(["admin"])),
) -> CfdiResponse:
    uuid = uuid4().hex
    total = sum(i.quantity * i.unit_price for i in payload.items)
    items_xml = "".join(
        f"<item desc='{i.description}' qty='{i.quantity}' price='{i.unit_price}'/>"
        for i in payload.items
    )
    xml_content = f"<cfdi uuid='{uuid}' customer='{payload.customer}' total='{total}'>{items_xml}</cfdi>"
    pdf_content = (
        f"CFDI {uuid}\nCliente: {payload.customer}\nTotal: {total}\n".encode("utf-8")
    )
    xml_url = upload_bytes(
        f"cfdi/{uuid}.xml", xml_content.encode("utf-8"), "application/xml"
    )
    pdf_url = upload_bytes(f"cfdi/{uuid}.pdf", pdf_content, "application/pdf")
    return CfdiResponse(uuid=uuid, xml_url=xml_url, pdf_url=pdf_url)
