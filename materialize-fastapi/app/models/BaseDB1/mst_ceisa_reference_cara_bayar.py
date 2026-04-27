"""Model master data CEISA untuk referensi cara bayar."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceCaraBayar(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_cara_bayar."""

    __tablename__ = "mst_ceisa_reference_cara_bayar"
