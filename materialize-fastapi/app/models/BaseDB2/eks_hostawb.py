from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Column, Integer, SmallInteger, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksHostAWB(BaseDB2):
    __tablename__ = "eks_hostawb"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    MasterAWB = Column(String(15))
    HostAWB = Column(String(25))
    kd_kemasan = Column(String(2))
    Quantity = Column(Integer)
    Weight = Column(DECIMAL(10, 2))
    Volume = Column(DECIMAL(10, 2))
    airlinescode = Column(String(2))
    FlightNo = Column(String(10))
    DateOfFlight = Column(String(10))

    kd_doc = Column(String(2), default="6")
    PENnumber = Column(String(35))
    KTKR = Column(String(6))
    DateOfPen = Column(String(10))
    HSCode = Column(String(5))
    descriptiongoods = Column(String(150))

    AgenCode = Column(String(19))
    ShipperCode = Column(String(19))

    shippername = Column(String(60))
    shipperaddress = Column(String(200))
    shippercity = Column(String(50))
    shippercountry = Column(String(50))
    shipperpostal = Column(String(10))
    shipperTaxNo = Column(String(20))  # noqa: N815

    ConsigneeCode = Column(String(19))
    Consigneename = Column(String(60))
    Consigneeaddress = Column(String(200))
    Consigneecity = Column(String(50))
    Consigneecountry = Column(String(50))

    bc11 = Column(String(6))
    tglbc = Column(String(10))
    nopos = Column(String(4))
    subpos = Column(String(4))
    subsubpos = Column(String(4))

    DateOfOut = Column(String(10))
    TimeOut = Column(String(8))
    DateOfIn = Column(String(10))
    TimeIn = Column(String(8))

    FHL = Column(SmallInteger, default=0)
    Status = Column(Integer, default=0)

    DateEntry = Column(String(10))
    TimeEntry = Column(String(8))
    void = Column(SmallInteger, default=0)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
