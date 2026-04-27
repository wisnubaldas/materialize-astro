"""Model master data CEISA untuk referensi daerah asal."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceDaerahAsal(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_daerah_asal."""

    __tablename__ = "mst_ceisa_reference_daerah_asal"
