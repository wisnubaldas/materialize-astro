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
from app.models.BaseDB1.mst_ceisa_reference_incoterm import MstCeisaReferenceIncoterm
from app.models.BaseDB1.mst_ceisa_reference_jenis_api import MstCeisaReferenceJenisApi
from app.models.BaseDB1.mst_ceisa_reference_jenis_ekspor import MstCeisaReferenceJenisEkspor
from app.models.BaseDB1.mst_ceisa_reference_jenis_identitas import MstCeisaReferenceJenisIdentitas
from app.models.BaseDB1.mst_ceisa_reference_jenis_impor import MstCeisaReferenceJenisImpor
from app.models.BaseDB1.mst_ceisa_reference_jenis_jaminan import MstCeisaReferenceJenisJaminan
from app.models.BaseDB1.mst_ceisa_reference_jenis_kemasan import MstCeisaReferenceJenisKemasan
from app.models.BaseDB1.mst_ceisa_reference_jenis_kontainer import MstCeisaReferenceJenisKontainer
from app.models.BaseDB1.mst_ceisa_reference_jenis_nilai import MstCeisaReferenceJenisNilai
from app.models.BaseDB1.mst_ceisa_reference_jenis_pengangkutan import (
    MstCeisaReferenceJenisPengangkutan,
)
from app.models.BaseDB1.mst_ceisa_reference_jenis_prosedur import MstCeisaReferenceJenisProsedur
from app.models.BaseDB1.mst_ceisa_reference_jenis_pungutan import MstCeisaReferenceJenisPungutan
from app.models.BaseDB1.mst_ceisa_reference_jenis_tanda_pengaman import (
    MstCeisaReferenceJenisTandaPengaman,
)
from app.models.BaseDB1.mst_ceisa_reference_jenis_tarif import MstCeisaReferenceJenisTarif
from app.models.BaseDB1.mst_ceisa_reference_jenis_tpb import MstCeisaReferenceJenisTpb
from app.models.BaseDB1.mst_ceisa_reference_jenis_transaksi_perdagangan import (
    MstCeisaReferenceJenisTransaksiPerdagangan,
)
from app.models.BaseDB1.mst_ceisa_reference_kantor import MstCeisaReferenceKantor
from app.models.BaseDB1.mst_ceisa_reference_kategori_barang import MstCeisaReferenceKategoriBarang
from app.models.BaseDB1.mst_ceisa_reference_kategori_ekspor import MstCeisaReferenceKategoriEkspor
from app.models.BaseDB1.mst_ceisa_reference_kategori_keluar_ftz import (
    MstCeisaReferenceKategoriKeluarFtz,
)
from app.models.BaseDB1.mst_ceisa_reference_kategori_konsolidator import (
    MstCeisaReferenceKategoriKonsolidator,
)
from app.models.BaseDB1.mst_ceisa_reference_kategori_masuk_ftz import (
    MstCeisaReferenceKategoriMasukFtz,
)
from app.models.BaseDB1.mst_ceisa_reference_komoditi_cukai import MstCeisaReferenceKomoditiCukai
from app.models.BaseDB1.mst_ceisa_reference_kondisi_barang import MstCeisaReferenceKondisiBarang
from app.models.BaseDB1.mst_ceisa_reference_lokasi_bayar import MstCeisaReferenceLokasiBayar
from app.models.BaseDB1.mst_ceisa_reference_negara import MstCeisaReferenceNegara
from app.models.BaseDB1.mst_ceisa_reference_respon import MstCeisaReferenceRespon
from app.models.BaseDB1.mst_ceisa_reference_satuan_barang import MstCeisaReferenceSatuanBarang
from app.models.BaseDB1.mst_ceisa_reference_spesifikasi_khusus import (
    MstCeisaReferenceSpesifikasiKhusus,
)
from app.models.BaseDB1.mst_ceisa_reference_spesifikasi_khusus_detail import (
    MstCeisaReferenceSpesifikasiKhususDetail,
)
from app.models.BaseDB1.mst_ceisa_reference_status import MstCeisaReferenceStatus
from app.models.BaseDB1.mst_ceisa_reference_status_pengusaha import MstCeisaReferenceStatusPengusaha
from app.models.BaseDB1.mst_ceisa_reference_tipe_kontainer import MstCeisaReferenceTipeKontainer
from app.models.BaseDB1.mst_ceisa_reference_tujuan_pemasukan import MstCeisaReferenceTujuanPemasukan
from app.models.BaseDB1.mst_ceisa_reference_tujuan_pengeluaran import (
    MstCeisaReferenceTujuanPengeluaran,
)
from app.models.BaseDB1.mst_ceisa_reference_tujuan_pengiriman import (
    MstCeisaReferenceTujuanPengiriman,
)
from app.models.BaseDB1.mst_ceisa_reference_tutup_pu import MstCeisaReferenceTutupPu
from app.models.BaseDB1.mst_ceisa_reference_ukuran_kontainer import MstCeisaReferenceUkuranKontainer
from app.models.BaseDB1.mst_ceisa_reference_valuta import MstCeisaReferenceValuta

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
    "referensi-incoterm": MstCeisaReferenceIncoterm,
    "referensi-jenis-api": MstCeisaReferenceJenisApi,
    "referensi-jenis-ekspor": MstCeisaReferenceJenisEkspor,
    "referensi-jenis-identitas": MstCeisaReferenceJenisIdentitas,
    "referensi-jenis-impor": MstCeisaReferenceJenisImpor,
    "referensi-jenis-jaminan": MstCeisaReferenceJenisJaminan,
    "referensi-jenis-kemasan": MstCeisaReferenceJenisKemasan,
    "referensi-jenis-kontainer": MstCeisaReferenceJenisKontainer,
    "referensi-jenis-nilai": MstCeisaReferenceJenisNilai,
    "referensi-jenis-pengangkutan": MstCeisaReferenceJenisPengangkutan,
    "referensi-jenis-prosedur": MstCeisaReferenceJenisProsedur,
    "referensi-jenis-pungutan": MstCeisaReferenceJenisPungutan,
    "referensi-jenis-tanda-pengaman": MstCeisaReferenceJenisTandaPengaman,
    "referensi-jenis-tarif": MstCeisaReferenceJenisTarif,
    "referensi-jenis-tpb": MstCeisaReferenceJenisTpb,
    "referensi-jenis-transaksi-perdagangan": MstCeisaReferenceJenisTransaksiPerdagangan,
    "referensi-kantor": MstCeisaReferenceKantor,
    "referensi-kategori-barang": MstCeisaReferenceKategoriBarang,
    "referensi-kategori-ekspor": MstCeisaReferenceKategoriEkspor,
    "referensi-kategori-keluar-ftz": MstCeisaReferenceKategoriKeluarFtz,
    "referensi-kategori-konsolidator": MstCeisaReferenceKategoriKonsolidator,
    "referensi-kategori-masuk-ftz": MstCeisaReferenceKategoriMasukFtz,
    "referensi-komoditi-cukai": MstCeisaReferenceKomoditiCukai,
    "referensi-kondisi-barang": MstCeisaReferenceKondisiBarang,
    "referensi-lokasi-bayar": MstCeisaReferenceLokasiBayar,
    "referensi-negara": MstCeisaReferenceNegara,
    "referensi-respon": MstCeisaReferenceRespon,
    "referensi-satuan-barang": MstCeisaReferenceSatuanBarang,
    "referensi-spesifikasi-khusus": MstCeisaReferenceSpesifikasiKhusus,
    "referensi-spesifikasi-khusus-detail": MstCeisaReferenceSpesifikasiKhususDetail,
    "referensi-status": MstCeisaReferenceStatus,
    "referensi-status-pengusaha": MstCeisaReferenceStatusPengusaha,
    "referensi-tipe-kontainer": MstCeisaReferenceTipeKontainer,
    "referensi-tujuan-pemasukan": MstCeisaReferenceTujuanPemasukan,
    "referensi-tujuan-pengeluaran": MstCeisaReferenceTujuanPengeluaran,
    "referensi-tujuan-pengiriman": MstCeisaReferenceTujuanPengiriman,
    "referensi-tutup-pu": MstCeisaReferenceTutupPu,
    "referensi-ukuran-kontainer": MstCeisaReferenceUkuranKontainer,
    "referensi-valuta": MstCeisaReferenceValuta,
}
