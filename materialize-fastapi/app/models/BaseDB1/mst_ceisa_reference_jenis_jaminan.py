"""Model master data CEISA untuk referensi jenis jaminan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisJaminan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_jaminan."""

    __tablename__ = "mst_ceisa_reference_jenis_jaminan"
