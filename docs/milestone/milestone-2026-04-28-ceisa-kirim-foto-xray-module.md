# Milestone CEISA Kirim Foto X-Ray Module (2026-04-28)

## Tanggal
2026-04-28

## Analisis Kondisi Saat Ini
- Modul CEISA sudah memiliki fondasi OAuth, HTTP client, request/response logging, dan mekanisme background job untuk sinkronisasi referensi.
- Struktur sudah dipindahkan ke `app/integrations/ceisa`.
- Belum ada modul untuk service CEISA Barang Kiriman: `kirim-foto-xray`.
- Belum ada model transaksi khusus untuk menampung payload request kirim foto X-Ray dan daftar file gambar.

## Gap Analysis (Sekarang vs Target)
1. Endpoint bisnis:
- Sekarang: belum ada route internal untuk kirim foto X-Ray CEISA.
- Target: tersedia route backend untuk enqueue kirim foto X-Ray.

2. Persistensi payload:
- Sekarang: belum ada tabel transaksi untuk payload `nomorAju`, `nomorBlAwb`, `tanggalBlAwb`, `kodeKantor`, dan metadata image.
- Target: tersedia model + migrasi transaksi CEISA dengan prefix `ceisa_*`.

3. Background job H2H:
- Sekarang: belum ada job runner untuk kirim foto X-Ray.
- Target: pengiriman ke CEISA dilakukan asynchronous via background job.

4. Integrasi reusable:
- Sekarang: belum ada service CEISA khusus upload multipart X-Ray.
- Target: service di `app/integrations/ceisa` reusable, konsisten dengan DI + repository pattern.

## Rencana Implementasi Bertahap
1. Definisikan schema payload request kirim foto X-Ray.
2. Tambah model transaksi + migrasi (`ceisa_xray_photo_request` dan `ceisa_xray_photo_request_image`).
3. Tambah repository untuk enqueue/status/update job dan manajemen metadata image.
4. Tambah service integrasi CEISA kirim foto X-Ray di `app/integrations/ceisa`.
5. Tambah job runner untuk proses upload multipart ke CEISA.
6. Tambah route API untuk enqueue job + cek status.
7. Verifikasi compile dan update progress harian.

## Estimasi Risiko
- Risiko menengah: format multipart `data` (application/json) + `images` dapat gagal bila header `Content-Type` dipaksa `application/json`.
- Risiko menengah: ukuran file image besar dapat mempengaruhi storage lokal sementara.
- Risiko rendah: perubahan import/DI lintas modul CEISA.

## Mitigasi
- Ubah CEISA client agar mendukung multipart tanpa hardcode `Content-Type: application/json`.
- Simpan file secara terstruktur di storage private dan kirim via background job.
- Lakukan validasi minimal MIME type image dan compile check penuh.
