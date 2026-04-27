"""Model master data CEISA untuk referensi ukuran kontainer."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceUkuranKontainer(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_ukuran_kontainer."""

    __tablename__ = "mst_ceisa_reference_ukuran_kontainer"
