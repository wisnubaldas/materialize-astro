"""Model master data CEISA untuk referensi dokumen."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceDokumen(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_dokumen."""

    __tablename__ = "mst_ceisa_reference_dokumen"
