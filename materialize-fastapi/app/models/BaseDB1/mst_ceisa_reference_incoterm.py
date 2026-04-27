"""Model master data CEISA untuk referensi incoterm."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceIncoterm(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_incoterm."""

    __tablename__ = "mst_ceisa_reference_incoterm"
