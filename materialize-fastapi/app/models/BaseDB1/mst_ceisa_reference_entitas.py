"""Model master data CEISA untuk referensi entitas."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceEntitas(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_entitas."""

    __tablename__ = "mst_ceisa_reference_entitas"
