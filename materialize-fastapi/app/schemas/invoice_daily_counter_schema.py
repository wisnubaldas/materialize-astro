from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class InvoiceDailyCounterBase(BaseModel):
    tanggal: date
    jumlah_invoice: int
    total_koli: Decimal
    total_berat: Decimal
    total_volume: Decimal
    total_pendapatan_tanpa_ppn: Decimal
    total_pendapatan_dengan_ppn: Decimal

    model_config = ConfigDict(from_attributes=True)


class InvoiceDailyCounterGet(InvoiceDailyCounterBase):
    id: int
    created_at: datetime
    updated_at: datetime


class InvoiceDailyCounterMonthlySummary(BaseModel):
    year: int
    month: int
    total_sent: int
