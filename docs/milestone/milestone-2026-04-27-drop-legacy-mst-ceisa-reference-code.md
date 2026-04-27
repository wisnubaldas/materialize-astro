# Milestone Analysis - Drop Legacy mst_ceisa_reference_code

## Tanggal Analisis
2026-04-27

## Analisis Kondisi Codebase Saat Ini
- Refactor sebelumnya sudah memecah master referensi CEISA ke tabel dedicated per `reference_slug`.
- Tabel lama `mst_ceisa_reference_code` masih eksis sehingga berpotensi menimbulkan kebingungan source of truth.
- Model legacy `app/models/BaseDB1/mst_ceisa_reference_code.py` juga masih tersisa walau tidak lagi dipakai repository baru.

## Gap Analysis (Current vs Target)
- Current: arsitektur baca/tulis sudah berbasis tabel dedicated, tetapi tabel legacy masih ada.
- Target: tabel legacy dihapus dari skema aktif agar tidak rancu dengan tabel baru per referensi.
- Gap utama: belum ada migration resmi untuk drop tabel legacy.

## Rencana Implementasi Bertahap (Milestone)
1. Tambahkan migration baru setelah head terakhir untuk drop `mst_ceisa_reference_code`.
2. Hapus model legacy `mst_ceisa_reference_code.py` agar kode konsisten dengan skema baru.
3. Jalankan verifikasi lint, compile, dan cek `alembic heads`.

## Estimasi Risiko
- Risiko rollback: jika rollback dibutuhkan, tabel legacy harus bisa dibuat ulang.
- Risiko deploy bertahap: environment yang belum menjalankan seluruh migration split tetap harus aman saat migration drop dijalankan.
- Mitigasi:
  - Migration drop dibuat defensif (cek eksistensi tabel/index sebelum drop).
  - `downgrade()` disediakan untuk recreate tabel legacy beserta index standar.
