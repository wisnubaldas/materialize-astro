"""Model master data referensi asal barang CEISA."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class MstCeisaReferenceOriginGoods(BaseDB1):
    """Representasi tabel master referensi asal barang CEISA."""

    __tablename__ = "mst_ceisa_reference_origin_goods"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False, unique=True)
    name = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)
    source = Column(String(30), nullable=False, server_default="CEISA")
    is_active = Column(Boolean, nullable=False, server_default="1")
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)
