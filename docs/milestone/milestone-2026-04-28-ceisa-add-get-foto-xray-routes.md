# Milestone CEISA Add/Get Foto X-Ray Routes (2026-04-28)

## Tanggal
2026-04-28

## Analisis Kondisi Saat Ini
- Route `kirim-foto-xray` sudah tersedia dan berjalan via background job.
- Belum ada route internal untuk service CEISA `add-foto-xray` dan `get-foto-xray`.
- Aturan arsitektur project mewajibkan kirim/tarik data CEISA melalui background job.

## Gap Analysis (Sekarang vs Target)
1. Endpoint operasi:
- Sekarang: hanya route enqueue `kirim`.
- Target: route enqueue `add` dan `get` beserta status job.

2. Persistensi job:
- Sekarang: tabel queue upload belum membedakan operasi `KIRIM` vs `ADD`.
- Target: operation type tersimpan agar eksekusi endpoint tepat.

3. Queue tarik data:
- Sekarang: belum ada queue model khusus request `get-foto-xray`.
- Target: ada tabel transaksi `ceisa_xray_photo_get_request` untuk proses async.

## Rencana Implementasi
1. Tambah `operation_type` pada queue upload X-Ray.
2. Tambah tabel queue get X-Ray.
3. Tambah service integrasi dan job runner untuk get X-Ray.
4. Tambah route enqueue/status untuk add/get.
5. Jalankan compile verification.

## Risiko
- Risiko menengah: migrasi beruntun `0030 -> 0031` perlu diterapkan berurutan di environment.
- Risiko rendah: perubahan response schema status upload karena tambahan field `operation_type`.

## Mitigasi
- Menjaga backward path route existing tetap sama.
- Menambahkan status endpoint terpisah untuk get agar tidak campur dengan queue upload.
