from typing import Any
from pydantic import BaseModel

class VoidInvoiceSchemaBase(BaseModel) :
    TANGGAL: str
    NO_INVOICE: str
    HAWB: str
    SMU: str
    class Config:
        from_attributes = True
class VoidInvoiceSchemaRequest(VoidInvoiceSchemaBase) :
    USR: str
    PSW: str
class VoidInvoiceSchemaResponse(VoidInvoiceSchemaBase):
    RESPONSE: Any
    
class VoidInvoiceSchemaCreate(VoidInvoiceSchemaBase) :
    RESPONSE: str
