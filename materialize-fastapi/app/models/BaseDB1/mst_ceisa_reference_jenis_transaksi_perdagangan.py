"""Model master data CEISA untuk referensi jenis transaksi perdagangan."""

from app.db.mysql import BaseDB1
from app.models.BaseDB1.mst_ceisa_reference_base import MstCeisaReferenceBaseMixin


class MstCeisaReferenceJenisTransaksiPerdagangan(MstCeisaReferenceBaseMixin, BaseDB1):
    """Representasi tabel mst_ceisa_reference_jenis_transaksi_perdagangan."""

    __tablename__ = "mst_ceisa_reference_jenis_transaksi_perdagangan"
