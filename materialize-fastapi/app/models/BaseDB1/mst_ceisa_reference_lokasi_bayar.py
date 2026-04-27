"""Model master data CEISA untuk referensi lokasi bayar."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceLokasiBayar(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_lokasi_bayar."""

    __tablename__ = "mst_ceisa_reference_lokasi_bayar"
