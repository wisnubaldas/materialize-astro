# Milestone Analysis - CEISA Env Simplify and OAuth Login Route

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Konfigurasi CEISA pada `.env` sebelumnya ambigu karena key duplikat fungsi (`CEISA_CLIENT_ID/SECRET` vs `CEISA_USERNAME/PASSWORD`).
- `CEISA_AUTH_URL` sebelumnya berpotensi diisi base host saja, sehingga berisiko gagal jika tidak mengarah ke endpoint login.
- Belum ada endpoint API internal untuk mengetes login OAuth CEISA secara cepat.

## Gap Analysis (Current vs Target)
- Current:
  - Struktur env CEISA belum ringkas dan mudah dipahami.
  - Dokumentasi variabel env CEISA belum eksplisit.
  - Belum ada route test login CEISA.
- Target:
  - Blok `.env` CEISA sederhana, tidak ambigu, dan diberi komentar penjelasan variabel.
  - Docstring CEISA env tersedia di source settings.
  - Ada route login test untuk validasi koneksi OAuth CEISA.

## Rencana Implementasi Bertahap (Milestone)
1. Sederhanakan blok CEISA di `.env` menjadi key utama:
   - `CEISA_BASE_URL`, `CEISA_USERNAME`, `CEISA_PASSWORD`, `CEISA_API_KEY`.
2. Jadikan `CEISA_AUTH_URL` dan `CEISA_REFRESH_URL` sebagai optional override.
3. Tambah docstring penjelasan variabel CEISA di `app/utils/env.py`.
4. Tambah route test login CEISA pada router CEISA.
5. Verifikasi syntax dan update progress report.

## Estimasi Risiko
- Risiko salah kredensial di env target runtime meskipun format env sudah benar.
- Risiko endpoint OAuth override terisi base host tanpa path.
- Mitigasi:
  - normalisasi di OAuth service untuk mengubah base host menjadi endpoint login/refresh default,
  - endpoint login test untuk validasi cepat dari sisi API.
