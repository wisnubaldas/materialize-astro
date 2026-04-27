"""Model master data CEISA untuk referensi tutup pu."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceTutupPu(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_tutup_pu."""

    __tablename__ = "mst_ceisa_reference_tutup_pu"
