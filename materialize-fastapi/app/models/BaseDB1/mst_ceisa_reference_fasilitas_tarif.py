"""Model master data CEISA untuk referensi fasilitas tarif."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceFasilitasTarif(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_fasilitas_tarif."""

    __tablename__ = "mst_ceisa_reference_fasilitas_tarif"
