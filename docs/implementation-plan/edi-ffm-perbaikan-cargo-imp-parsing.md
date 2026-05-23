# Implementation Plan: Perbaikan FFM — Gagal Parsing Cargo-IMP

**Tanggal:** 2026-05-23  
**Status:** ✅ SELESAI DIEKSEKUSI  
**Scope:** Backend FastAPI (`materialize-fastapi/`) + Dokumentasi (`AGENTS.md`)

---

## Latar Belakang

Module **EDI > FFM** gagal men-generate Cargo-IMP karena data pada tabel `build_up_check_detail` tidak lengkap (terutama `origin`, `pieces`, `weight`, `volume`). Diperlukan fallback lookup ke DB2 (SSoT) menggunakan `MasterAWB` sebagai parameter dengan relasi tabel berikut:

1. `eks_weighingheader.MasterAWB = eks_weighingdetail.MasterAWB`
2. `eks_weighingheader.ShipperCode = mst_customer.CustomerCode`
3. `eks_weighingheader.ConsigneeCode = mst_customer.CustomerCode`
4. `eks_weighingheader.InvoiceNumber = eks_invoiceheader.InvoiceNumber`

**Catatan arsitektur:** DB2, DB3, DB4 adalah database SSoT (Single Source of Truth) yang hanya boleh dibaca. Seluruh operasi write tetap di DB1 saja.

---

## Root Cause Analysis

### Bug #1 — `origin` selalu kosong → Cargo-IMP gagal generate

Di `edi_service.py → generate_ffm_build_up_preview()`:
```python
origin = (_first_text(getattr(first_legacy_header, "Origin", None)) or "").upper()
```
`first_legacy_header` bisa `None` jika `get_legacy_weighing_header()` tidak menemukan data karena `flight_no` tidak cocok format (`FlightNumber` di DB vs `flight_no` di build up bisa berbeda: `"GA103"` vs `"103"` vs `"GA 103"`). Akibatnya `origin = ""` → `missing_fields` bertambah → `generated = False`.

### Bug #2 — `get_legacy_weighing_header()` tidak fallback ke MasterAWB saja

Logika lama hanya fallback dari `flight_no` ke tanpa filter, tapi ketika `flight_date` juga tidak cocok, query masih gagal menemukan record. Diperlukan 3-step fallback.

### Bug #3 — `volume` tidak dihitung dari dimensi

`eks_weighingdetail` memiliki kolom `LongCargo`, `WidthCargo`, `HighCargo` yang bisa dipakai menghitung volume (`cm³ / 1_000_000 = m³`), tapi tidak dimanfaatkan sebagai fallback.

### Bug #4 — Tidak ada model/query untuk `eks_invoiceheader`

Sesuai permintaan, field data pendukung bisa diambil dari `eks_invoiceheader` via relasi `eks_weighingheader.InvoiceNumber = eks_invoiceheader.InvoiceNumber`, namun model SQLAlchemy untuk tabel ini belum ada.

### Bug #5 — Chain fallback `pieces`, `weight` tidak lengkap

Tidak ada fallback ke `eks_invoiceheader.TotalPieces` dan `eks_invoiceheader.TotalNetto` jika semua sumber lain kosong.

---

## Perubahan yang Dilaksanakan

### 1. [MODIFY] `AGENTS.md`

Tambah section **"Aturan Database SSoT (Single Source of Truth) — WAJIB DIPATUHI"** yang mendokumentasikan:
- Tabel hak akses per database (DB1=READ+WRITE, DB2/DB3/DB4=READ-ONLY)
- Larangan eksplisit INSERT/UPDATE/DELETE/COMMIT ke DB2, DB3, DB4
- Contoh dependency injection yang benar vs salah

---

### 2. [NEW] `app/models/BaseDB2/eks_invoiceheader.py`

Model read-only SQLAlchemy untuk tabel `eks_invoiceheader` di DB2 (SSoT).

Kolom yang diimplementasikan (37 kolom, sesuai konfirmasi user):
```
noid, InvoiceNumber, TotalPieces, TotalCAW, TotalNetto,
TotalWarehouseFee, TotalAssistancyFee, TotalCoolRoomFee,
TotalAirConditioningFee, TotalColdStorageFee, TotalStrongRoomFee,
TotalDangerousRoomFee, TotalOtherFee, TotalAirportContriFee,
AdministrationFee, DocumentFee, SubTotalFee, TaxFee, StampFee,
GrandTotalFee, EmployeeNumber, DateOfTransaction, TimeOfTransaction,
PrintNumber, DRSCNumber, DateOfDRSC, AirlinesCode, PaymentCode,
AgreementCode, KursIDR, Referensi, TaxNumber, CustomerCode,
ShiftName, void, token, created_at, updated_at
```

**Catatan:** Model ini didaftarkan ke `BaseDB2` (read-only engine). Tidak ada operasi write.

---

### 3. [MODIFY] `app/repositories/edi_repository.py`

**3a. Import baru:**
```python
from app.models.BaseDB2.eks_invoiceheader import EksInvoiceHeader
```

**3b. Perbaikan `get_legacy_weighing_header()` — 3-Step Fallback Strategy:**
```
Attempt 1: MasterAWB + FlightNumber LIKE flight_no + DateOfFlight LIKE flight_date
Attempt 2: MasterAWB + DateOfFlight LIKE flight_date  (jika flight_no format tidak cocok)
Attempt 3: MasterAWB saja — ambil record terbaru (fallback paling luas)
```

**3c. Method baru `get_legacy_invoice_by_mawb()`:**
```python
def get_legacy_invoice_by_mawb(self, mawb: str) -> EksInvoiceHeader | None:
    """
    Query: eks_invoiceheader JOIN eks_weighingheader
    WHERE eks_weighingheader.MasterAWB = mawb
    ORDER BY eks_weighingheader.noid DESC
    LIMIT 1
    """
```

---

### 4. [MODIFY] `app/services/edi_service.py`

**4a. Helper baru `_calc_volume_from_dimensions()`:**
```python
def _calc_volume_from_dimensions(long_cm, width_cm, high_cm) -> float | None:
    """Hitung volume m3 dari dimensi LongCargo x WidthCargo x HighCargo (dalam cm)."""
    # return float((p * w * h) / 1_000_000) atau None jika salah satu None/0
```

**4b. Perbaikan `generate_ffm_build_up_preview()`:**
- Tambah `first_invoice = self.repository.get_legacy_invoice_by_mawb(detail.mawb)`
- Loop break condition: `if first_legacy_header or first_host or first_invoice`
- Fallback `carrier` tambah `getattr(first_invoice, "AirlinesCode", None)`
- `origin` sekarang juga fallback ke `getattr(first_invoice, "Origin", None)` — graceful None
- `destination` tambah fallback `getattr(first_invoice, "Destination", None)`

**4c. Perbaikan `_map_ffm_detail()` — Chain Fallback Lengkap:**

| Field   | Chain Fallback (berurutan)                                                                              |
|---------|----------------------------------------------------------------------------------------------------------|
| pieces  | rincian(sum) → detail.total_pieces → detail.master_total_pieces → weighingdetail.Pieces → weighingheader.TotalPieces → hostawb.Quantity → **invoiceheader.TotalPieces** |
| weight  | rincian(sum) → weighingdetail.GrossWeight → weighingdetail.NettoWeight → weighingheader.TotalNetto → hostawb.Weight → **invoiceheader.TotalNetto** |
| volume  | weighingdetail.VolumeCargo → weighingheader.TotalVolume → hostawb.Volume → **LongCargo x WidthCargo x HighCargo / 1_000_000** |

---

## Verification Plan

### Automated (Sudah Dilakukan)

```bash
poetry run ruff check app/repositories/edi_repository.py \
                       app/services/edi_service.py \
                       app/models/BaseDB2/eks_invoiceheader.py
# Result: All checks passed!
```

### Manual (Perlu Dilakukan Setelah Deploy)

1. Akses endpoint `GET /edi/ffm-build-up/{header_id}/preview` dengan `header_id` yang sebelumnya menghasilkan `generated: false`.
2. Pastikan response berubah menjadi `generated: true` dengan `cargo_imp` terisi.
3. Validasi sintaks Cargo-IMP di https://www.parse2.com/service-cargoimp.shtml menggunakan tipe pesan **FFM/8**.
4. Periksa `missing_fields` dan `warnings` pada response — jika masih ada, analisis field yang kosong.

---

## Catatan Risiko

| Risiko | Kemungkinan | Mitigasi |
|--------|-------------|----------|
| `eks_invoiceheader` tidak punya kolom `Origin`/`Destination` | Terkonfirmasi (kolom tidak ada) | `getattr(..., None)` — graceful, tidak error, hanya tidak memberi nilai |
| Volume dari dimensi salah unit (mm bukan cm) | Rendah | Validasi dengan data aktual setelah deploy |
| `eks_invoiceheader` tidak ada data untuk MAWB tertentu | Mungkin terjadi | Fallback graceful, field tetap None, dan akan masuk `missing_fields` |

---

## File yang Diubah

| File | Jenis | Keterangan |
|------|-------|-----------|
| `AGENTS.md` | MODIFY | Tambah aturan SSoT DB read-only permanen |
| `app/models/BaseDB2/eks_invoiceheader.py` | NEW | Model read-only eks_invoiceheader |
| `app/repositories/edi_repository.py` | MODIFY | Import model baru + 2 method baru/diubah |
| `app/services/edi_service.py` | MODIFY | 1 helper baru + 2 method diubah |
| `docs/report-progress/progress-2026-05-23.md` | NEW | Laporan progres harian |
