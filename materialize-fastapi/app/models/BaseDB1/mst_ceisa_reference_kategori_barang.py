"""Model master data CEISA untuk referensi kategori barang."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKategoriBarang(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kategori_barang."""

    __tablename__ = "mst_ceisa_reference_kategori_barang"
