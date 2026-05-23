from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Boolean, Column, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksInvoiceHeader(BaseDB2):
    """
    Model read-only untuk tabel eks_invoiceheader di DB2 (SSoT operasional legacy).

    PERINGATAN: DB2 adalah Single Source of Truth (SSoT).
    Dilarang keras melakukan INSERT, UPDATE, DELETE, atau COMMIT pada tabel ini.
    Gunakan hanya untuk membaca data sebagai fallback/enrichment.

    Kolom yang tersedia dipakai sebagai fallback data pada proses:
    - Parsing FFM Cargo-IMP (pieces, weight dari TotalPieces, TotalNetto)
    - Enrichment data weighing jika eks_weighingdetail tidak memiliki data lengkap.
    """

    __tablename__ = "eks_invoiceheader"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    InvoiceNumber = Column(String(20), nullable=False, index=True)

    TotalPieces = Column(Integer, nullable=True)
    TotalCAW = Column(DECIMAL(10, 2), nullable=True)
    TotalNetto = Column(DECIMAL(10, 2), nullable=True)

    TotalWarehouseFee = Column(DECIMAL(10, 2), nullable=True)
    TotalAssistancyFee = Column(DECIMAL(10, 2), nullable=True)
    TotalCoolRoomFee = Column(DECIMAL(10, 2), nullable=True)
    TotalAirConditioningFee = Column(DECIMAL(10, 2), nullable=True)
    TotalColdStorageFee = Column(DECIMAL(10, 2), nullable=True)
    TotalStrongRoomFee = Column(DECIMAL(10, 2), nullable=True)
    TotalDangerousRoomFee = Column(DECIMAL(10, 2), nullable=True)
    TotalOtherFee = Column(DECIMAL(10, 2), nullable=True)
    TotalAirportContriFee = Column(DECIMAL(10, 2), nullable=True)

    AdministrationFee = Column(DECIMAL(10, 2), nullable=True)
    DocumentFee = Column(DECIMAL(10, 2), nullable=True)
    SubTotalFee = Column(DECIMAL(10, 2), nullable=True)
    TaxFee = Column(DECIMAL(10, 2), nullable=True)
    StampFee = Column(DECIMAL(10, 2), nullable=True)
    GrandTotalFee = Column(DECIMAL(10, 2), nullable=True)

    EmployeeNumber = Column(String(10), nullable=True)
    DateOfTransaction = Column(String(10), nullable=True)
    TimeOfTransaction = Column(String(8), nullable=True)
    PrintNumber = Column(Boolean, default=False, nullable=True)
    DRSCNumber = Column(String(20), nullable=True)
    DateOfDRSC = Column(String(10), nullable=True)

    AirlinesCode = Column(String(2), nullable=True)
    PaymentCode = Column(String(1), nullable=True)
    AgreementCode = Column(String(20), nullable=True)
    KursIDR = Column(DECIMAL(10, 2), nullable=True)
    Referensi = Column(String(50), nullable=True)
    TaxNumber = Column(String(50), nullable=True)
    CustomerCode = Column(String(19), nullable=True)
    ShiftName = Column(String(50), nullable=True)

    void = Column(Boolean, default=False, nullable=True)
    token = Column(String(5), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), nullable=True)
