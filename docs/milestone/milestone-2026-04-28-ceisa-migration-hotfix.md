# Milestone Analysis - CEISA Migration Hotfix

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Migrasi chain CEISA reference expansion (`aa0000000001` s.d. `aa0000000027`) gagal saat dieksekusi di MySQL.
- Error awal: nama index melebihi batas identifier MySQL (64 karakter), contoh:
  `ix_mst_ceisa_reference_jenis_transaksi_perdagangan_reference_slug`.
- Setelah perbaikan nama index, migrasi lanjut namun ditemukan error kedua saat seed `mst_ceisa_reference_satuan_barang`:
  `Incorrect string value` karena tabel belum menggunakan charset `utf8mb4`.

## Gap Analysis (Current vs Target)
- Current:
  - Sebagian migration create-table memakai naming index terlalu panjang untuk MySQL.
  - Migration belum cukup robust untuk kondisi rerun setelah kegagalan partial DDL.
  - Charset tabel pada seed data multilingual belum dipastikan UTF-8 penuh.
- Target:
  - Seluruh nama index migration aman (< 64 chars).
  - Migration kritikal dapat rerun aman setelah kegagalan (idempotent checks).
  - Tabel yang menerima seed multilingual menggunakan `utf8mb4`.

## Rencana Implementasi Bertahap (Milestone)
1. Pendekkan semua nama index pada migration `aa0000000001` s.d. `aa0000000027`.
2. Hardening migration `aa0000000008` (kasus yang sempat gagal) agar idempotent:
   - cek table/index eksisting,
   - seed hanya jika tabel masih kosong.
3. Hardening migration `aa000000001c`:
   - cek table/index eksisting,
   - set/convert tabel ke `utf8mb4`,
   - seed hanya jika tabel kosong.
4. Tambahkan charset `utf8mb4` pada migration create-table CEISA expansion agar konsisten.
5. Verifikasi ulang dengan `alembic upgrade head` dan `alembic current`.

## Estimasi Risiko
- Risiko environment divergen karena sebagian migration sempat gagal di tengah eksekusi.
- Risiko karakter data internasional gagal insert bila tabel tetap non-utf8mb4.
- Mitigasi:
  - migration dibuat idempotent pada titik gagal,
  - charset dipastikan `utf8mb4`,
  - verifikasi langsung ke database dengan `alembic upgrade head` sukses.
