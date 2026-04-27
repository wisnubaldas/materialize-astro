"""Model master data CEISA untuk referensi kategori masuk ftz."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKategoriMasukFtz(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kategori_masuk_ftz."""

    __tablename__ = "mst_ceisa_reference_kategori_masuk_ftz"
