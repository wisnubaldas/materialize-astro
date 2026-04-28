# Milestone CEISA Integration Refactor (2026-04-28)

## Tanggal
2026-04-28

## Analisis Kondisi Saat Ini
- Core integrasi CEISA sebelumnya berada di `app/services/ceisa/*` (client, oauth, log, parser katalog, sync job) dan belum mengikuti struktur target `app/integrations/ceisa/*`.
- Endpoint sinkronisasi referensi CEISA sudah menggunakan background job (`/ceisa/reference-codes/{reference_slug}/sync`) dan menyimpan status di `ceisa_reference_sync_log`.
- Logging request/response outbound CEISA sudah tersedia melalui `ceisa_request_log` dan logging webhook pada `ceisa_webhook_log`.
- Repository referensi CEISA sudah memisahkan master data per tabel `mst_ceisa_*` dan telah mendukung sinkronisasi snapshot.
- Registry model referensi CEISA masih diletakkan di namespace service lama.

## Gap Analysis (Kondisi Sekarang vs Target Arsitektur)
1. Struktur modul:
- Sekarang: service integrasi CEISA ada di `app/services/ceisa`.
- Target: seluruh service integrasi CEISA berada di `app/integrations/ceisa`.

2. Reusability method agnostic:
- Sekarang: normalisasi payload CEISA masih embedded di service tertentu.
- Target: tersedia utilitas agnostic terpisah (mapper/schema/exception/signature) agar reusable lintas service CEISA/non-CEISA.

3. Dependency wiring:
- Sekarang: dependency, job, dan repository masih mengimpor namespace lama.
- Target: dependency injection konsisten mengarah ke `app/integrations/ceisa`.

4. Kompatibilitas perubahan:
- Sekarang: perpindahan namespace berisiko memutus import lama.
- Target: tetap backward-compatible selama masa transisi.

## Rencana Implementasi Bertahap
1. Bangun paket baru `app/integrations/ceisa` dan pindahkan implementasi inti CEISA.
2. Tambahkan komponen agnostic (`mapper.py`, `schemas.py`, `exceptions.py`, `signature.py`).
3. Rewire import pada API/dependencies/job/repository/service agar memakai namespace integrasi baru.
4. Sediakan shim kompatibilitas pada `app/services/ceisa/*` (re-export class lama).
5. Jalankan verifikasi statik minimal (`compileall`) dan catat hasilnya.

## Estimasi Risiko
- Risiko tinggi: import path regression lintas modul saat runtime.
- Risiko menengah: behavioral drift pada normalisasi payload jika mapper baru tidak identik.
- Risiko rendah: duplikasi namespace sementara (integrations + shim service) selama masa transisi.

## Mitigasi
- Menjaga signature class/function tetap sama.
- Menyediakan shim kompatibilitas import lama.
- Melakukan verifikasi compile setelah refactor.
