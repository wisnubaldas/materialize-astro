"""Model master data CEISA untuk referensi kategori keluar ftz."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKategoriKeluarFtz(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kategori_keluar_ftz."""

    __tablename__ = "mst_ceisa_reference_kategori_keluar_ftz"
