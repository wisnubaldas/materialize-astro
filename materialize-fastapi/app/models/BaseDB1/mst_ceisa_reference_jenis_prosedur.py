"""Model master data CEISA untuk referensi jenis pib / prosedur."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisProsedur(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_prosedur."""

    __tablename__ = "mst_ceisa_reference_jenis_prosedur"
