"""Model master data referensi CEISA lintas kategori."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class MstCeisaReferenceCode(BaseDB1):
    """Representasi tabel master referensi CEISA."""

    __tablename__ = "mst_ceisa_reference_code"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference_slug = Column(String(80), nullable=False)
    reference_name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)
    doc_url = Column(String(255), nullable=True)
    source = Column(String(30), nullable=False, server_default="CEISA_GITBOOK")
    is_active = Column(Boolean, nullable=False, server_default="1")
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)
