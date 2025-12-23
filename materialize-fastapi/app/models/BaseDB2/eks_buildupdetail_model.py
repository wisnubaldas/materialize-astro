from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, Double, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksBuildUpDetail(BaseDB2):
    __tablename__ = "eks_buildupdetail"

    noid = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    BuildUpNumber = Column(String(18), nullable=True)
    MasterAWB = Column(String(15), nullable=True)
    Parsial = Column(String(1), nullable=True)
    TransitCode = Column(String(3), nullable=True)
    PartPieces = Column(Integer, nullable=True)
    Pieces = Column(Integer, nullable=True)
    PartNetto = Column(Double, nullable=True)
    Netto = Column(Double, nullable=True)
    Volume = Column(Double, nullable=True)
    UldCardNumber = Column(String(15), nullable=True)
    KindOfGood = Column(String(50), nullable=True)
    EmployeeNumber = Column(String(10), nullable=True)
    AgenCode = Column(String(19), nullable=True)
    condition = Column(String(50), nullable=True)
    OverLoadCode = Column(String(1), nullable=True)
    DONumber = Column(String(18), nullable=True)
    Remarks = Column(String(25), nullable=True)
    OfficialUse = Column(String(25), nullable=True)
    PrintNumber = Column(Integer, nullable=True, default=0)
    DateEntry = Column(String(10), nullable=True)
    TimeEntry = Column(String(8), nullable=True)
    FFM = Column(Boolean, default=False)
    void = Column(Boolean, default=False)
    token = Column(String(5), nullable=True, default="71901")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp(), nullable=False)
