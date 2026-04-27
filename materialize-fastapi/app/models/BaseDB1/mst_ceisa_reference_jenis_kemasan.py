"""Model master data CEISA untuk referensi jenis kemasan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisKemasan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_kemasan."""

    __tablename__ = "mst_ceisa_reference_jenis_kemasan"
