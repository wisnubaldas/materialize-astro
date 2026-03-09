from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Column, Date, Integer, func, text

from app.db.mysql import BaseDB1


class InvoiceDailyCounter(BaseDB1):
    __tablename__ = "invoice_daily_counter"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tanggal = Column(Date, nullable=False, unique=True)
    jumlah_invoice = Column(Integer, nullable=False, server_default=text("0"))
    total_koli = Column(DECIMAL(18, 2), nullable=False, server_default=text("0.00"))
    total_berat = Column(DECIMAL(18, 2), nullable=False, server_default=text("0.00"))
    total_volume = Column(DECIMAL(18, 2), nullable=False, server_default=text("0.00"))
    total_pendapatan_tanpa_ppn = Column(
        DECIMAL(18, 2), nullable=False, server_default=text("0.00")
    )
    total_pendapatan_dengan_ppn = Column(
        DECIMAL(18, 2), nullable=False, server_default=text("0.00")
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
