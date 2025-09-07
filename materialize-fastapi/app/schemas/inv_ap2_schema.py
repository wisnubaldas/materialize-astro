# app/schemas/invoice_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InvAp2Base(BaseModel):
    NO_INVOICE: Optional[str] = None
    TANGGAL: str
    SMU: str
    KDAIRLINE: str
    FLIGHT_NUMBER: str
    DOM_INT: str
    INC_OUT: str
    ASAL: str
    TUJUAN: str
    JENIS_KARGO: str
    TARIF_KARGO: str
    KOLI: str
    BERAT: str
    VOLUME: str
    JML_HARI: str
    CARGO_CHG: str
    KADE: str
    TOTAL_PENDAPATAN_TANPA_PPN: str
    TOTAL_PENDAPATAN_DENGAN_PPN: str

    PJT_HANDLING_FEE: Optional[int] = None
    RUSH_HANDLING_FEE: Optional[int] = None
    RUSH_SERVICE_FEE: Optional[int] = None
    TRANSHIPMENT_FEE: Optional[int] = None
    ADMINISTRATION_FEE: Optional[int] = None
    DOCUMENTS_FEE: Optional[int] = None
    PECAH_PU_FEE: Optional[int] = None
    COOL_COLD_STORAGE_FEE: Optional[int] = None
    STRONG_ROOM_FEE: Optional[int] = None
    AC_ROOM_FEE: Optional[int] = None
    DG_ROOM_FEE: Optional[int] = None
    AVI_ROOM_FEE: Optional[int] = None
    DANGEROUS_GOOD_CHECK_FEE: Optional[int] = None
    DISCOUNT_FEE: Optional[int] = None
    RKSP_FEE: Optional[int] = None

    HAWB: str
    HAWB_FEE: Optional[int] = None
    HAWB_MAWB_FEE: Optional[int] = None
    CSC_FEE: Optional[int] = None
    ENVIROTAINER_ELEC_FEE: Optional[int] = None
    ADDITIONAL_COSTS: Optional[int] = None
    NAWB_FEE: Optional[int] = None
    BARCODE_FEE: Optional[int] = None
    CARGO_DEVELOPMENT_FEE: Optional[int] = None
    DUTIABLE_SHIPMENT_FEE: Optional[int] = None
    FHL_FEE: Optional[int] = None
    FWB_FEE: Optional[int] = None
    CARGO_INSPECTION_REPORT_FEE: Optional[int] = None
    MATERAI_FEE: Optional[int] = None
    PPN_FEE: Optional[int] = None

    status: int = 1
    class Config:
        from_attributes = True # Ubah `orm_mode = True` (Pydantic V1) menjadi `from_attributes = True` (Pydantic V2)

class InvoiceCreate(InvAp2Base):
    pass


class InvoiceGet(InvAp2Base):
    id: int
    created_at: datetime
    updated_at: datetime
