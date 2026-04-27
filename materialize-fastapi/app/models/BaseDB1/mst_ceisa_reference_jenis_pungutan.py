"""Model master data CEISA untuk referensi jenis pungutan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisPungutan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_pungutan."""

    __tablename__ = "mst_ceisa_reference_jenis_pungutan"
