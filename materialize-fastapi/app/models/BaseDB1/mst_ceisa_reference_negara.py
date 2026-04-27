"""Model master data CEISA untuk referensi negara."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceNegara(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_negara."""

    __tablename__ = "mst_ceisa_reference_negara"
