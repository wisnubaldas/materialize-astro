"""Model master data CEISA untuk referensi tujuan pemasukan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceTujuanPemasukan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_tujuan_pemasukan."""

    __tablename__ = "mst_ceisa_reference_tujuan_pemasukan"
