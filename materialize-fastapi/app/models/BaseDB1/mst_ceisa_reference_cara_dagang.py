"""Model master data CEISA untuk referensi cara dagang."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceCaraDagang(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_cara_dagang."""

    __tablename__ = "mst_ceisa_reference_cara_dagang"
