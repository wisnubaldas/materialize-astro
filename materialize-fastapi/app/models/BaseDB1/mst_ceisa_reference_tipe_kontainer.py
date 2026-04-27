"""Model master data CEISA untuk referensi tipe kontainer."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceTipeKontainer(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_tipe_kontainer."""

    __tablename__ = "mst_ceisa_reference_tipe_kontainer"
