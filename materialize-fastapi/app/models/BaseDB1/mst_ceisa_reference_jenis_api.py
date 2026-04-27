"""Model master data CEISA untuk referensi jenis api."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisApi(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_api."""

    __tablename__ = "mst_ceisa_reference_jenis_api"
