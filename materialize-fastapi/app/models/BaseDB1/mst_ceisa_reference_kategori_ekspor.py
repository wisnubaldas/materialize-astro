"""Model master data CEISA untuk referensi kategori ekspor."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKategoriEkspor(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kategori_ekspor."""

    __tablename__ = "mst_ceisa_reference_kategori_ekspor"
