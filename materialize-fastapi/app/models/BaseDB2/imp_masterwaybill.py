from sqlalchemy import DECIMAL, TIMESTAMP, Boolean, Column, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpMasterWaybill(BaseDB2):
    __tablename__ = "imp_masterwaybill"

    MasterAWB = Column(String(15), primary_key=True)
    Pieces = Column(DECIMAL(18, 0))
    Weight = Column(DECIMAL(18, 0))
    Volume = Column(DECIMAL(18, 0))
    AirlinesCode = Column(String(2))
    FlightNo = Column(String(5))
    Origin = Column(String(3))
    Destination = Column(String(3))
    DateOfFight = Column(String(10))
    KindOfGood = Column(String(25))
    KindOfCode = Column(String(5))
    HSCode = Column(String(5))
    AgenCode = Column(String(19))
    ShipperCode = Column(String(19))
    ConsigneeCode = Column(String(19))
    bc11 = Column(String(6))
    tglbc11 = Column(String(10))
    nopos = Column(String(12))
    Multihost = Column(String(1))
    Parsial = Column(String(1))
    DateOfOut = Column(String(10))
    TimeOut = Column(String(5))
    DateOfIn = Column(String(10))
    TimeIn = Column(String(5))
    void = Column(Boolean, default=False)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
