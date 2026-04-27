"""Model master data CEISA untuk referensi jenis ekspor."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisEkspor(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_ekspor."""

    __tablename__ = "mst_ceisa_reference_jenis_ekspor"
