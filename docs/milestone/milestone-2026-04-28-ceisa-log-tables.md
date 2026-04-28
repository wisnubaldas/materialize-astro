# Milestone Analysis - CEISA Log Tables

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Integrasi CEISA sudah memiliki `ceisa_reference_sync_log` untuk job sinkronisasi referensi.
- Tabel khusus untuk log request outbound CEISA (`ceisa_request_log`) belum tersedia.
- Tabel khusus untuk log webhook inbound CEISA (`ceisa_webhook_log`) belum tersedia.
- AGENTS terbaru mewajibkan log request/response CEISA serta model log webhook.

## Gap Analysis (Current vs Target)
- Current:
  - Belum ada skema persistensi terpisah untuk request/response API CEISA.
  - Belum ada skema persistensi webhook CEISA (payload, verifikasi signature, hasil proses).
- Target:
  - Tersedia tabel transaksi `ceisa_request_log` untuk jejak request outbound dan response.
  - Tersedia tabel transaksi `ceisa_webhook_log` untuk jejak webhook inbound.
  - Model SQLAlchemy dan migration tersedia sehingga siap dipakai service/repository CEISA.

## Rencana Implementasi Bertahap (Milestone)
1. Tambah model `CeisaRequestLog` pada `app/models/BaseDB1/ceisa_request_log.py`.
2. Tambah model `CeisaWebhookLog` pada `app/models/BaseDB1/ceisa_webhook_log.py`.
3. Tambah migration baru untuk create kedua tabel dengan index operasional.
4. Verifikasi syntax/import terhadap model+migration baru.
5. Update laporan progres harian.

## Estimasi Risiko
- Risiko ukuran payload log membesar seiring volume request/webhook.
- Risiko retensi data log tidak terkontrol jika tidak ada kebijakan archival.
- Mitigasi:
  - Simpan payload ke kolom text dan index hanya pada kolom query penting.
  - Tahap lanjutan menambahkan kebijakan retention/purge log berkala.
