"""Model master data CEISA untuk referensi spesifikasi khusus."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceSpesifikasiKhusus(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_spesifikasi_khusus."""

    __tablename__ = "mst_ceisa_reference_spesifikasi_khusus"
