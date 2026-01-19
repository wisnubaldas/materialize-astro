from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Boolean, Column, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpBreakdownHeader(BaseDB2):
    __tablename__ = "imp_breakdownheader"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    BreakdownNumber = Column(String(20), nullable=False)
    AirlinesCode = Column(String(2))
    OriginCode = Column(String(6))
    FlightNumber = Column(String(5))
    DateOfFlight = Column(String(10))
    DateOfArrival = Column(String(10))
    TimeOfArrival = Column(String(8))
    EmployeeNumber = Column(String(10))
    OperatorName = Column(String(25))
    TotalMasterAWB = Column(Integer)
    TotalPieces = Column(Integer)
    TotalNetto = Column(DECIMAL(10, 2))
    TotalCAW = Column(DECIMAL(10, 2))
    AirCraftNumber = Column(String(20))
    Supervisor = Column(String(50))
    DateEntry = Column(String(10))
    TimeEntry = Column(String(8))
    void = Column(Boolean, default=False)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
