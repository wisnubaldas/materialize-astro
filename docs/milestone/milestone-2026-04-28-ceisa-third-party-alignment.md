# Milestone Analysis - CEISA Third-Party Alignment

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Endpoint sinkronisasi CEISA `POST /ceisa/reference-codes/{reference_slug}/sync` sebelumnya mengeksekusi proses sinkronisasi secara langsung di request thread.
- Belum ada tabel transaksi khusus untuk mencatat request/response sinkronisasi CEISA (status antrean, waktu mulai, waktu selesai, hasil, dan error).
- Struktur service CEISA reusable (`app/services/ceisa`) sudah tersedia, tetapi belum ada orchestrator job untuk alur queue -> process -> status.
- Master data CEISA (`mst_ceisa_*`) sudah memiliki migration + seeder terpisah per kategori.

## Gap Analysis (Current vs Target)
- Current:
  - Proses sinkronisasi belum job-based end-to-end.
  - Belum ada log/outbox transaksi sinkronisasi CEISA.
  - Belum ada endpoint status job sinkronisasi CEISA.
- Target:
  - Tarik data CEISA/GitBook diproses melalui background job.
  - Request/response sinkronisasi tersimpan pada tabel transaksi `ceisa_*`.
  - Tersedia endpoint enqueue dan endpoint monitoring status job.

## Rencana Implementasi Bertahap (Milestone)
1. Tambah tabel transaksi `ceisa_reference_sync_log` + migration.
2. Tambah `CeisaLogRepository` untuk CRUD status queue/job.
3. Tambah `CeisaSyncJobService` (reusable orchestrator) di `app/services/ceisa`.
4. Tambah runner job `app/job/ceisa_sync_job.py`.
5. Ubah endpoint sync menjadi enqueue background job + tambah endpoint status job.
6. Verifikasi syntax/import (`compileall`) dan dokumentasikan hasil.

## Estimasi Risiko
- Background task FastAPI bergantung lifecycle proses aplikasi; jika worker restart, job in-flight bisa terhenti.
- Potensi duplicate enqueue untuk `reference_slug` yang sama jika dipicu paralel.
- Mitigasi:
  - Simpan status job ke tabel transaksi untuk auditability dan retry manual.
  - Tahap lanjutan: tambahkan dedup/rate limit enqueue per `reference_slug` dan opsi scheduler retry.
