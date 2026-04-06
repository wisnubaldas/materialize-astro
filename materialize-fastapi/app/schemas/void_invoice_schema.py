from typing import Any

from pydantic import BaseModel


class VoidInvoiceSchemaBase(BaseModel):
    TANGGAL: str
    NO_INVOICE: str
    HAWB: str | None = None
    SMU: str | None = None

    class Config:
        from_attributes = True


class VoidInvoiceSchemaRequest(VoidInvoiceSchemaBase):
    USR: str
    PSW: str


class VoidInvoiceSchemaResponse(VoidInvoiceSchemaBase):
    success: bool
    message: str
    status: str
    affected_rows: int = 0
    void: int
    response: Any | None = None
