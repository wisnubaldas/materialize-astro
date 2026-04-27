"""Model master data CEISA untuk referensi cara angkut."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceCaraAngkut(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_cara_angkut."""

    __tablename__ = "mst_ceisa_reference_cara_angkut"
