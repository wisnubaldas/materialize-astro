from sqlalchemy import TIMESTAMP, Column, Float, Integer, SmallInteger, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksMasterWaybill(BaseDB2):
    __tablename__ = "eks_masterwaybill"

    MasterAWB = Column(String(15), primary_key=True)
    Pieces = Column(Integer)
    Weight = Column(Float)
    Volume = Column(Float)
    AirlinesCode = Column(String(2))
    FlightNo = Column(String(7))
    Origin = Column(String(3))
    Destination = Column(String(3))
    DateOfFlight = Column(String(10))
    KindOfGood = Column(String(50))
    KindOfCode = Column(String(6))
    PENnumber = Column(String(6))
    KTKR = Column(String(6))
    DateOfPen = Column(String(10))
    HSCode = Column(String(5))
    AgenCode = Column(String(19))
    ShipperCode = Column(String(19))
    ConsigneeCode = Column(String(19))
    bc11 = Column(String(6))
    tglbc11 = Column(String(10))
    nopos = Column(String(12))
    Multihost = Column(String(1), default="0")
    Parsial = Column(String(1), default="0")
    DateOfOut = Column(String(10))
    TimeOut = Column(String(8))
    DateOfIn = Column(String(10))
    TimeIn = Column(String(8))
    RCS = Column(SmallInteger, default=0)
    FWB = Column(SmallInteger, default=0)
    PDE = Column(SmallInteger, default=0)
    Status = Column(SmallInteger, default=0)
    DateEntry = Column(String(10))
    TimeEntry = Column(String(8))
    void = Column(SmallInteger, default=0)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
