from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class MstDiscrepancyCode(BaseDB1):
    __tablename__ = "mst_discrepancy_code"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(20), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    severity = Column(String(10), nullable=False)
    hold_delivery = Column(Boolean, nullable=False, default=False)
    require_photo = Column(Boolean, nullable=False, default=False)
    require_remark = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime)
