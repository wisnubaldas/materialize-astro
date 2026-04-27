"""Model master data CEISA untuk referensi kantor."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKantor(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_kantor."""

    __tablename__ = "mst_ceisa_reference_kantor"
