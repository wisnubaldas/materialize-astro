"""Model master data CEISA untuk referensi jenis tanda pengaman."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisTandaPengaman(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_tanda_pengaman."""

    __tablename__ = "mst_ceisa_reference_jenis_tanda_pengaman"
