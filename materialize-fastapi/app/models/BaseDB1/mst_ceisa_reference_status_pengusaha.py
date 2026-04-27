"""Model master data CEISA untuk referensi status pengusaha."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceStatusPengusaha(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_status_pengusaha."""

    __tablename__ = "mst_ceisa_reference_status_pengusaha"
