from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpPodHeader(BaseDB2):
    __tablename__ = "imp_podheader"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    TravelNumber = Column(String(20), nullable=False)
    InvoiceNumber = Column(String(20))
    Referensi = Column(String(10))
    DateOfOut = Column(String(10))
    TimeOfOut = Column(String(8))
    EmployeeNumber = Column(String(10))
    ConsigneeCode = Column(String(19))
    DLV = Column(Boolean, default=False)
    void = Column(Boolean, default=False)
    token = Column(String(5))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
