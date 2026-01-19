from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class ImpLocationMps(BaseDB2):
    __tablename__ = "imp_location_mps"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    HostAWB = Column(String(25))
    mps = Column(String(25))
    Location = Column(String(25))
    scandate = Column(String(10))
    scantime = Column(String(8))
    token = Column(String(5))
    flag_out = Column(Boolean, default=False)
    time_out = Column(String(30))
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
