"""Mixin model master referensi CEISA untuk tabel per kategori."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.sql import func


class MstCeisaReferenceBaseMixin:
    """Kolom umum yang dipakai semua master referensi CEISA."""

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference_slug = Column(String(80), nullable=False)
    reference_name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="1")
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)
