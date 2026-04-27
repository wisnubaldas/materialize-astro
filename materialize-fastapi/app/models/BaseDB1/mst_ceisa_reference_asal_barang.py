"""Model master data CEISA untuk referensi asal barang."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceAsalBarang(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_asal_barang."""

    __tablename__ = "mst_ceisa_reference_asal_barang"
