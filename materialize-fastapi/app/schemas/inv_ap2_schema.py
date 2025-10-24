# app/schemas/invoice_schema.py
from datetime import datetime

from pydantic import BaseModel, Field


class InvAp2Base(BaseModel):
    NO_INVOICE: str
    TANGGAL: str
    SMU: str
    KDAIRLINE: str
    FLIGHT_NUMBER: str
    DOM_INT: str
    INC_OUT: str
    ASAL: str
    TUJUAN: str | None = Field(default=None, description="Kode tujuan")
    JENIS_KARGO: str
    TARIF_KARGO: int | str
    KOLI: str
    BERAT: str
    VOLUME: str
    JML_HARI: str
    CARGO_CHG: str
    KADE: str
    TOTAL_PENDAPATAN_TANPA_PPN: str
    TOTAL_PENDAPATAN_DENGAN_PPN: str

    PJT_HANDLING_FEE: int | None = None
    RUSH_HANDLING_FEE: int | None = None
    RUSH_SERVICE_FEE: int | None = None
    TRANSHIPMENT_FEE: int | None = None
    ADMINISTRATION_FEE: int | None = None
    DOCUMENTS_FEE: int | None = None
    PECAH_PU_FEE: int | None = None
    COOL_COLD_STORAGE_FEE: int | None = None
    STRONG_ROOM_FEE: int | None = None
    AC_ROOM_FEE: int | None = None
    DG_ROOM_FEE: int | None = None
    AVI_ROOM_FEE: int | None = None
    DANGEROUS_GOOD_CHECK_FEE: int | None = None
    DISCOUNT_FEE: int | None = None
    RKSP_FEE: int | None = None

    HAWB: str
    HAWB_FEE: int | None = None
    HAWB_MAWB_FEE: int | None = None
    CSC_FEE: int | None = None
    ENVIROTAINER_ELEC_FEE: int | None = None
    ADDITIONAL_COSTS: int | None = None
    NAWB_FEE: int | None = None
    BARCODE_FEE: int | None = None
    CARGO_DEVELOPMENT_FEE: int | None = None
    DUTIABLE_SHIPMENT_FEE: int | None = None
    FHL_FEE: int | None = None
    FWB_FEE: int | None = None
    CARGO_INSPECTION_REPORT_FEE: int | None = None
    MATERAI_FEE: int | None = None
    PPN_FEE: int | None = None

    status: int = 1

    class Config:
        from_attributes = True  # Ubah `orm_mode = True` (Pydantic V1) menjadi `from_attributes = True` (Pydantic V2)
    
    def model_post_init(self, __context):
        """Set nilai default TUJUAN ke 'CGK' jika None atau tidak dikirim."""
        if not self.TUJUAN:
            self.TUJUAN = "CGK"

class InvoiceCreate(InvAp2Base):
    pass


class InvoiceGet(InvAp2Base):
    id: int
    created_at: datetime
    updated_at: datetime


class InvoiceMonthlySummary(BaseModel):
    year: int
    month: int
    total_sent: int


class InvoiceDailySummary(BaseModel):
    year: int
    month: int
    day: int
    total_sent: int
