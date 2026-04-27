"""Model master data CEISA untuk referensi jenis pengangkutan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisPengangkutan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_pengangkutan."""

    __tablename__ = "mst_ceisa_reference_jenis_pengangkutan"
