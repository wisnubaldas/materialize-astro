from decimal import Decimal, InvalidOperation
from typing import Any

from pydantic import BaseModel, field_validator


class AP2SendInv(BaseModel):
    USR: str
    PSW: str
    NO_INVOICE: str
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
    PJT_HANDLING_FEE: str
    RUSH_HANDLING_FEE: str
    RUSH_SERVICE_FEE: str
    TRANSHIPMENT_FEE: str
    ADMINISTRATION_FEE: str
    DOCUMENTS_FEE: str
    PECAH_PU_FEE: str
    COOL_COLD_STORAGE_FEE: str
    STRONG_ROOM_FEE: str
    AC_ROOM_FEE: str
    DG_ROOM_FEE: str
    AVI_ROOM_FEE: str
    DANGEROUS_GOOD_CHECK_FEE: str
    DISCOUNT_FEE: str
    RKSP_FEE: str
    HAWB: str | None = None
    HAWB_FEE: str
    HAWB_MAWB_FEE: str
    CSC_FEE: str
    ENVIROTAINER_ELEC_FEE: str
    ADDITIONAL_COSTS: str
    NAWB_FEE: str
    BARCODE_FEE: str
    CARGO_DEVELOPMENT_FEE: str
    DUTIABLE_SHIPMENT_FEE: str
    FHL_FEE: str
    FWB_FEE: str
    CARGO_INSPECTION_REPORT_FEE: str
    MATERAI_FEE: str
    PPN_FEE: str

    @field_validator(
        "BERAT",
        "VOLUME",
        "JML_HARI",
        "CARGO_CHG",
        "KADE",
        "TOTAL_PENDAPATAN_TANPA_PPN",
        "TOTAL_PENDAPATAN_DENGAN_PPN",
        "PJT_HANDLING_FEE",
        "RUSH_HANDLING_FEE",
        "RUSH_SERVICE_FEE",
        "TRANSHIPMENT_FEE",
        "ADMINISTRATION_FEE",
        "DOCUMENTS_FEE",
        "PECAH_PU_FEE",
        "COOL_COLD_STORAGE_FEE",
        "STRONG_ROOM_FEE",
        "AC_ROOM_FEE",
        "DG_ROOM_FEE",
        "AVI_ROOM_FEE",
        "DANGEROUS_GOOD_CHECK_FEE",
        "DISCOUNT_FEE",
        "RKSP_FEE",
        "HAWB_FEE",
        "HAWB_MAWB_FEE",
        "CSC_FEE",
        "ENVIROTAINER_ELEC_FEE",
        "ADDITIONAL_COSTS",
        "NAWB_FEE",
        "BARCODE_FEE",
        "CARGO_DEVELOPMENT_FEE",
        "DUTIABLE_SHIPMENT_FEE",
        "FHL_FEE",
        "FWB_FEE",
        "CARGO_INSPECTION_REPORT_FEE",
        "MATERAI_FEE",
        "PPN_FEE",
        mode="before",
    )
    @classmethod
    def round_numeric(cls, v: Any) -> str:
        """
        Pastikan semua numeric dibulatkan ke string integer.
        Misalnya '21250.00' -> '21250'
        """
        if v is None or v == "":
            return "0"
        try:
            d = Decimal(str(v))
            if d == d.to_integral():  # kalau bulat
                return str(int(d))
            return str(d.normalize())  # kalau ada pecahan, rapikan
        except (InvalidOperation, ValueError, TypeError):
            return str(v)
