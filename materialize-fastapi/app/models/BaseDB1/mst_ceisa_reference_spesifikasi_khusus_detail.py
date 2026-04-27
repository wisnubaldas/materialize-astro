"""Model master data CEISA untuk referensi spesifikasi khusus detail."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceSpesifikasiKhususDetail(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_spesifikasi_khusus_detail."""

    __tablename__ = "mst_ceisa_reference_spesifikasi_khusus_detail"
