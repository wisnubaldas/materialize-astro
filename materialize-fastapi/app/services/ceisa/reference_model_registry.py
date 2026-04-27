"""Registry model SQLAlchemy per reference slug CEISA."""

from __future__ import annotations

from typing import TypeAlias

from sqlalchemy.orm import DeclarativeMeta

from app.models.BaseDB1.mst_ceisa_reference_asal_barang import MstCeisaReferenceAsalBarang
from app.models.BaseDB1.mst_ceisa_reference_asal_barang_ftz import MstCeisaReferenceAsalBarangFtz
from app.models.BaseDB1.mst_ceisa_reference_bank import MstCeisaReferenceBank
from app.models.BaseDB1.mst_ceisa_reference_cara_angkut import MstCeisaReferenceCaraAngkut
from app.models.BaseDB1.mst_ceisa_reference_cara_bayar import MstCeisaReferenceCaraBayar
from app.models.BaseDB1.mst_ceisa_reference_cara_dagang import MstCeisaReferenceCaraDagang
from app.models.BaseDB1.mst_ceisa_reference_daerah_asal import MstCeisaReferenceDaerahAsal
from app.models.BaseDB1.mst_ceisa_reference_dokumen import MstCeisaReferenceDokumen
from app.models.BaseDB1.mst_ceisa_reference_entitas import MstCeisaReferenceEntitas
from app.models.BaseDB1.mst_ceisa_reference_fasilitas import MstCeisaReferenceFasilitas
from app.models.BaseDB1.mst_ceisa_reference_fasilitas_tarif import MstCeisaReferenceFasilitasTarif
from app.models.BaseDB1.mst_ceisa_reference_ijin import MstCeisaReferenceIjin

CeisaReferenceModel: TypeAlias = DeclarativeMeta

CEISA_REFERENCE_MODEL_REGISTRY: dict[str, CeisaReferenceModel] = {
    "referensi-asal-barang": MstCeisaReferenceAsalBarang,
    "referensi-asal-barang-ftz": MstCeisaReferenceAsalBarangFtz,
    "referensi-bank": MstCeisaReferenceBank,
    "referensi-cara-angkut": MstCeisaReferenceCaraAngkut,
    "referensi-cara-bayar": MstCeisaReferenceCaraBayar,
    "referensi-cara-dagang": MstCeisaReferenceCaraDagang,
    "referensi-daerah-asal": MstCeisaReferenceDaerahAsal,
    "referensi-dokumen": MstCeisaReferenceDokumen,
    "referensi-entitas": MstCeisaReferenceEntitas,
    "referensi-fasilitas": MstCeisaReferenceFasilitas,
    "referensi-fasilitas-tarif": MstCeisaReferenceFasilitasTarif,
    "referensi-ijin": MstCeisaReferenceIjin,
}
