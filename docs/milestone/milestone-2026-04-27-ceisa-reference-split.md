# Milestone Analysis - CEISA Reference Split

## Tanggal Analisis
2026-04-27

## Analisis Kondisi Codebase Saat Ini
- Endpoint CEISA generic sudah menggunakan parameter path `reference_slug` pada file `materialize-fastapi/app/api/ceisa.py`.
- Service `ceisa_reference_code_service` sudah memvalidasi slug terhadap katalog yang didukung.
- Repository `ceisa_reference_code_repository` sebelumnya masih mengarah ke satu tabel gabungan `mst_ceisa_reference_code`.
- Seeder dan migration data referensi CEISA sebelumnya monolitik dalam satu file besar (`ceisaReferenceCodeData.py` + migration `3c9f5a1e7b2d`).
- Struktur ini membuat isolasi data per referensi kurang baik dan memperbesar risiko konflik ketika dilakukan sinkronisasi/maintenance per kategori.

## Gap Analysis (Current vs Target)
- Current: satu model/tabel untuk semua referensi CEISA, dibedakan dengan `reference_slug`.
- Target: model, migration, dan seed dipisah per referensi, namun kontrak endpoint tetap generic dengan `reference_slug`.
- Gap utama:
  - Belum ada registry pemetaan slug ke model tabel dedicated.
  - Belum ada migration terpisah per referensi.
  - Belum ada seeder terpisah per referensi.

## Rencana Implementasi Bertahap (Milestone)
1. Milestone 1: Tambahkan registry slug ke model dedicated dan refactor repository agar query/sync/datatable memilih model berdasarkan `reference_slug`.
2. Milestone 2: Tambahkan model SQLAlchemy dedicated untuk setiap referensi CEISA dengan skema kolom seragam.
3. Milestone 3: Split data seed ke file terpisah per referensi.
4. Milestone 4: Buat migration terpisah per referensi (create table + seed awal) dengan chain revisi berurutan.
5. Milestone 5: Verifikasi statik (lint + compile) pada seluruh perubahan backend CEISA.

## Estimasi Risiko
- Risiko inkonsistensi data: data lama masih tersimpan di tabel gabungan lama dan bisa berbeda dengan tabel dedicated baru jika migrasi belum dijalankan penuh.
- Risiko operasional migrasi: jumlah migration bertambah banyak sehingga perlu urutan deployment yang disiplin.
- Risiko performa datatable: penggantian model dinamis per slug perlu validasi ulang pada query filter/search.
- Mitigasi:
  - Validasi slug ketat via catalog service.
  - Seed awal dari snapshot yang sama per slug.
  - Verifikasi lint/compile setelah refactor.
