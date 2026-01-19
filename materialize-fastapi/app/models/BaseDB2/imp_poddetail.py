from sqlalchemy import TIMESTAMP, BigInteger, Column, Float, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpPodDetail(BaseDB2):
    __tablename__ = "imp_poddetail"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    TravelNumber = Column(String(20))
    InvoiceNumber = Column(String(20))
    MasterAWB = Column(String(15))
    HostAWB = Column(String(50))
    KindOfGood = Column(String(50))
    Pieces = Column(Integer)
    Netto = Column(Float)
    Volume = Column(Float)
    token = Column(String(5))
    void = Column(Integer)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
