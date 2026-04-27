# Milestone Analysis - CEISA Reference Expansion

## Tanggal Analisis
2026-04-27

## Analisis Kondisi Codebase Saat Ini
- Arsitektur generic endpoint CEISA sudah berjalan dengan `reference_slug` dan tabel split per sebagian referensi.
- Referensi baru yang diminta (39 kategori) belum memiliki model, migration, dan seeder dedicated.
- Masih ada kolom `doc_url` dan/atau `source` pada sebagian master referensi CEISA sehingga tidak seragam.
- Parser GitBook sebelumnya terbatas untuk tabel HTML 2 kolom sederhana, sehingga beberapa halaman referensi multi-kolom tidak terbaca penuh.

## Gap Analysis (Current vs Target)
- Current:
  - Hanya sebagian referensi CEISA tersedia sebagai master dedicated.
  - Struktur kolom antar master belum seragam (`doc_url`/`source` masih ada di beberapa tabel).
  - Cakupan parser untuk sinkronisasi referensi belum robust untuk format tabel GitBook yang beragam.
- Target:
  - 39 master referensi tambahan tersedia penuh (model + migration + seeder terpisah per referensi).
  - Seluruh master referensi CEISA seragam tanpa kolom `doc_url` dan `source`.
  - Parser sinkronisasi mampu menangani tabel HTML/markdown multi-varian.

## Rencana Implementasi Bertahap (Milestone)
1. Perluas katalog referensi CEISA dengan daftar slug dan nama resmi dari GitBook.
2. Buat model SQLAlchemy dedicated untuk 39 referensi baru dengan skema kolom seragam.
3. Generate seeder terpisah per referensi dari snapshot data GitBook CEISA.
4. Tambahkan migration terpisah per referensi (create table + seed awal).
5. Tambahkan migration normalisasi untuk menghapus kolom `doc_url` dan `source` pada tabel master referensi yang sudah ada.
6. Refactor schema/repository/service agar tidak lagi memakai `doc_url` dan `source`.
7. Verifikasi lint, compile, dan validasi head migration.

## Estimasi Risiko
- Ukuran seed data besar (contoh: satuan barang, spesifikasi khusus detail) meningkatkan durasi migration saat deploy.
- Perubahan parser dapat memengaruhi hasil sinkronisasi jika format GitBook berubah lagi.
- Penghapusan kolom `source` di modul referensi lama bisa berdampak jika ada query eksternal yang masih menggunakannya.
- Mitigasi:
  - Gunakan migration berurutan dan defensif untuk normalisasi kolom.
  - Validasi hasil parsing berdasarkan slug resmi GitBook dan deduplikasi pasangan `code`-`name`.
  - Pertahankan endpoint tetap generic (`reference_slug`) agar kontrak API tidak berubah.
