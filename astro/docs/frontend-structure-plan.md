# Frontend Structure Plan (Astro)

Dokumen ini melengkapi `astro/frontend_agent.md` untuk perapihan struktur folder frontend secara bertahap dan aman.

## Tujuan

- Mengurangi kebingungan antara `src/lib`, `src/js`, `src/libs`, `src/vendor`, dan `public/assets`.
- Menetapkan kepemilikan folder agar perubahan fitur berikutnya konsisten.
- Mencegah duplikasi dependency/asset.

## Konvensi Folder

- `src/lib`: source of truth untuk kode aplikasi frontend (API wrapper, auth, constants, util internal).
- `src/components`: komponen reusable per domain modul.
- `src/pages`: halaman/route Astro.
- `src/js`: script bootstrap/template dan inisialisasi plugin per halaman.
- `src/libs`: third-party library lokal yang tidak praktis dikelola via npm.
- `src/vendor`: vendor static bundle legacy/template.
- `src/scss`: design tokens dan styling override.
- `src/fonts`: font lokal.
- `public/assets`: aset statis final untuk disajikan langsung oleh server.

## Aturan Praktis

- Jangan menaruh business logic ke `src/js`, `src/libs`, atau `src/vendor`.
- Import library baru lewat npm lebih dulu; gunakan `src/libs` hanya bila perlu.
- Satu library hanya boleh hidup di satu tempat (`src/libs` atau `src/vendor`, bukan keduanya).
- Untuk script lama di `public/assets`, evaluasi peluang migrasi bertahap ke `src/js` agar bisa dikontrol build process.

## Strategi Refactor Bertahap

1. Audit per modul:
   - petakan file aktif vs tidak aktif.
   - identifikasi duplikasi library.
2. Rapikan per batch kecil:
   - satu domain modul per batch (misal `warehouse` dulu).
   - update import path dan jalankan build setiap batch.
3. Stabilkan interface:
   - expose helper lewat `src/lib` agar komponen tidak mengakses vendor langsung.
4. Dokumentasi:
   - catat setiap batch di `docs/progress-YYYY-MM-DD.md`.

## Risiko Utama

- Path asset lama rusak setelah pemindahan file.
- Plugin browser-only menyebabkan error SSR jika import tidak dijaga.
- Perubahan besar sekaligus memperbesar risiko regression.

## Mitigasi

- Gunakan refactor incremental, bukan pemindahan massal.
- Jalankan build dan smoke-check halaman terdampak tiap batch.
- Pertahankan fallback path sementara selama masa transisi.
