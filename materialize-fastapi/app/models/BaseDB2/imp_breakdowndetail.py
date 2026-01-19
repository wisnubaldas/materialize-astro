from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Boolean, Column, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpBreakdownDetail(BaseDB2):
    __tablename__ = "imp_breakdowndetail"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    BreakdownNumber = Column(String(20), nullable=False)
    MasterAWB = Column(String(15))
    Parsial = Column(Integer)
    PosMaster = Column(Integer)
    TransitCode = Column(String(3))
    Pieces = Column(Integer)
    Netto = Column(DECIMAL(10, 2))
    Volume = Column(DECIMAL(10, 2))
    KindOfCode = Column(String(5))
    KindOfGood = Column(String(50))
    UldCardNumber = Column(String(15))
    Remark = Column(String(50))
    EmployeeNumber = Column(String(10))
    DateOfBreakdown = Column(String(10))
    TimeOfBreakdown = Column(String(8))
    AirlinesCode = Column(String(2))
    FlightNumber = Column(String(5))
    OriginCode = Column(String(6))
    PrintNumber = Column(Boolean, default=False)
    LocationCode = Column(String(10))
    flagInvoice = Column(Boolean, default=False)
    RCF = Column(Boolean, default=False)
    NOA = Column(Boolean, default=False)
    sisa = Column(Integer)
    gatein = Column(Boolean, default=False)
    void = Column(Boolean, default=False)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
