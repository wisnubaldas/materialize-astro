from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Boolean, Column, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2  # sesuaikan path Base Anda


class EksWeighingHeader(BaseDB2):
    __tablename__ = "eks_weighingheader"

    noid = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    ProofNumber = Column(String(18), nullable=False, default="")
    MasterAWB = Column(String(15))
    AirlinesCode = Column(String(2))
    Origin = Column(String(3))
    Destination = Column(String(3))
    FlightNumber = Column(String(7))
    ShipperCode = Column(String(19))
    AgenCode = Column(String(19))
    ConsigneeCode = Column(String(19))
    AgenPIC = Column(String(50))

    TotalPieces = Column(Integer)
    TotalPallet = Column(DECIMAL(10, 2))
    TotalNetto = Column(DECIMAL(10, 2))
    TotalVolume = Column(DECIMAL(10, 2))
    TotalCAW = Column(DECIMAL(10, 2))

    DateOfFlight = Column(String(10))
    DateOfEntry = Column(String(10))
    TimeOfEntry = Column(String(8))
    BookingCode = Column(String(5))
    MultiVolume = Column(String(1))
    PaymentCode = Column(String(1))

    Directmaster = Column(Boolean, default=False)
    EmployeeNumber = Column(String(10))
    InvoiceNumber = Column(String(20))
    PrintNumber = Column(Boolean, default=False)
    report = Column(Boolean, default=False)
    RCS = Column(Boolean, default=False)
    FHL = Column(Boolean, default=False)
    FWB = Column(Boolean, default=False)
    void = Column(Boolean, default=False)
    gateIn = Column(Boolean, default=False)  # noqa: N815
    token = Column(String(5))

    created_at = Column(TIMESTAMP, server_default=func.now())
