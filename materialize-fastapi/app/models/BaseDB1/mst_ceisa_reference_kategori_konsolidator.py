"""Model master data CEISA untuk referensi kategori konsolidator."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKategoriKonsolidator(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kategori_konsolidator."""

    __tablename__ = "mst_ceisa_reference_kategori_konsolidator"
