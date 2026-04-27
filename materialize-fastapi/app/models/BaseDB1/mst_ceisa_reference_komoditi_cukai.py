"""Model master data CEISA untuk referensi komoditi cukai."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceKomoditiCukai(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_komoditi_cukai."""

    __tablename__ = "mst_ceisa_reference_komoditi_cukai"
