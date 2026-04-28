"""Model log sinkronisasi referensi CEISA berbasis background job."""

from sqlalchemy import BigInteger, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class CeisaReferenceSyncLog(BaseDB1):
    """Log antrian dan hasil eksekusi sinkronisasi referensi CEISA."""

    __tablename__ = "ceisa_reference_sync_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference_slug = Column(String(80), nullable=False, index=True)
    reference_name = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False, index=True)
    requested_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    inserted_count = Column(Integer, nullable=True)
    updated_count = Column(Integer, nullable=True)
    deactivated_count = Column(Integer, nullable=True)
    total_snapshot = Column(Integer, nullable=True)
    total_active = Column(Integer, nullable=True)
    error_message = Column(String(500), nullable=True)
