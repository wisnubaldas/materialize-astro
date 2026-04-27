"""Model master data CEISA untuk referensi ijin."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceIjin(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_ijin."""

    __tablename__ = "mst_ceisa_reference_ijin"
