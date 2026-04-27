"""Model master data CEISA untuk referensi kondisi barang."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKondisiBarang(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kondisi_barang."""

    __tablename__ = "mst_ceisa_reference_kondisi_barang"
