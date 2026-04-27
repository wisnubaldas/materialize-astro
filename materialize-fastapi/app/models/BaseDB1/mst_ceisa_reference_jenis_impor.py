"""Model master data CEISA untuk referensi kode jenis impor."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisImpor(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_impor."""

    __tablename__ = "mst_ceisa_reference_jenis_impor"
