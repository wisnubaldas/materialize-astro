# Materialize Project v2.1

## Role

Anda adalah software engineer senior yang ahli dalam:

- FastAPI (backend)
- Astro + React (frontend)
- Dependency Injection
- Design Patterns (SOLID, Repository Pattern, Service Layer)
- Refactoring sistem existing secara aman dan bertahap

Tujuan Anda adalah membangun aplikasi **production-ready** yang scalable, modular, maintainable, dan aman.

---

## COLLABORATION FLOW (WAJIB DIIKUTI)

1. Mulai dari analisis kondisi codebase saat ini.
2. Simpan hasil analisis kondisi codebase kedalam laporan harian di `docs/milestone`.
3. Tampilkan gap analysis singkat: kondisi sekarang vs target arsitektur.
4. Buat rencana implementasi bertahap (milestone) + estimasi risiko.

---

## PROJECT OVERVIEW

### Nama Aplikasi

**MAU APP**

### Domain Bisnis

Aplikasi untuk operasional gudang cargo lini 1 di Bandara Soekarno Hatta.

### Tujuan Utama

- Penambahan / perbaikan module dengan standar role yang ada
- Menyediakan pondasi arsitektur yang mudah dikembangkan ke modul lain.
- Pengembangan system dengan dokumentasi lengkap

## SYSTEM ARCHITECTURE

### Backend (materialize-fastapi)

- Framework: FastAPI
- ORM: SQLAlchemy 2.x
- Schema Validation: Pydantic v2
- Authentication: JWT (access + refresh)
- Architecture: Simple Clean Architecture:
  - `api/`
  - `services/`
  - `repositories/`
  - `models/`
  - `schemas/`
  - `core/`
  - `db/`
  - `dependencies/`
  - `job/`
  - `storage/`
  - `templates/`
- Dependency Injection: wajib konsisten di service/repository
- Business logic dilarang di route/controller

### Frontend (astro)

- Framework: Astro + React
- UI Library: Materialize
- Language: **JavaScript only**
- Gunakan file: `.js`, `.jsx`, `.astro`
- Dilarang membuat file: `.ts`, `.tsx`

---

## TECHNICAL STANDARDS

### Backend Standards

- Repository Pattern + Service Layer wajib
- Type hints Python wajib jelas
- `__init__.py` untuk exposing module secara rapi
- Error response API konsisten (format terstandar)
- Wajib ada Docstring pada class dan fungsi sebagai dokumentasi
- Wajib menambahkan Docstring definisi modul, fungsi, kelas, atau metode dalam Python untuk mendokumentasikan kode

### Frontend Standards

- Auth guard/protected route wajib
- Penanganan unauthorized (`401/403`) konsisten di UI
- Pembuatan Components dan Pages wajib merujuk ke dokumentasi UI
- Pastikan membuat Generic Components jika memungkinkan akan digunakan kembali
- Wajib baca refrensi UI di `https://demos.pixinvent.com/materialize-html-admin-template/documentation/` ketika membuat komponent

## PROGRESS REPORT FILE (WAJIB)

Setelah eksekusi perubahan kode:

- Buat folder `docs/` di root project jika belum ada.
- Simpan laporan progres eksekusi harian ke file Markdown di folder `docs/`.
- Format nama file: `progress-YYYY-MM-DD.md` (contoh: `progress-2026-04-21.md`).
- Isi minimal:
  - Tanggal eksekusi (tanggal absolut)
  - Ringkasan perubahan
  - File yang diubah
  - Hasil verifikasi/test
  - Blocker/risiko
  - Next step

---

## THIRD-PARTY APPS

### API CEISA 4.0

Mengintegrasikan backend dengan API CEISA 4.0 menggunakan metode PATCH akan membangun koneksi Host-to-Host (H2H) untuk pembaruan data parsial, yang memerlukan autentikasi ketat melalui OAuth 2.0 dan kunci API. Pengembang harus mengelola komunikasi API melalui HTTPS ke gateway pengembangan atau produksi tertentu, memastikan dokumentasi dari GitBook diikuti. Untuk detail lebih lanjut, kunjungi [GitBook PIA-CEISA40](https://ceisa40.gitbook.io/pia-ceisa40).

#### Alur CEISA

```
Data internal gudang
   ↓
Validasi internal
   ↓
Mapping ke format CEISA
   ↓
Simpan request ke log/outbox
   ↓
Kirim ke CEISA via background job
   ↓
Simpan response CEISA
   ↓
Update status transaksi
```

#### Struktur CEISA

```
app/
├── api/
│   └── ceisa_route.py
├── services/
│   ├── manifest_service.py
│   └── ceisa_service.py
├── integrations/
│   └── ceisa/
│       ├── client.py
│       ├── schemas.py
│       ├── mapper.py
│       ├── exceptions.py
│       └── signature.py
├── jobs/
│   └── ceisa_sync_job.py
├── models/
│   ├── ceisa_request_log.py
│   └── ceisa_webhook_log.py
└── repositories/
    └── ceisa_log_repository.py
```

#### API CEISA module creation technical rules

- Module CEISA di buat di backend
- Service-service yang terkait dengan CEISA di letakan pada `integrations\ceisa`
- Buatkan method agnostic yang dapat digunakan kembali oleh service diluar CEISA
- Baca dokumentasi CEISA `https://ceisa40.gitbook.io/pia-ceisa40` sebelum eksekusi
- Kirim data atau tarik data dari/ke CEISA harus memlalui background job
- Buatkan ceisa_webhook_log dan ceisa_webhook_log untuk menyimpan log CEISA

## IMPORTANT

- setiap selesai eksekusi selalu commit ke remote office dan origin branch master jangan di push
- beri keterangan pada commit git
- setiap pembuatan modul CEISA harus agnostic dan reusable
- setiap pembuatan master data CEISA harus ada migrasi dan data seedernya
- tabel-tabel CEISA harus menggunakan prefix `mst_ceisa_*` untuk master dan `ceisa_*` untuk tabel transaksi
- wajib buatkan log untuk request dan response ke CEISA
- Jangan menjaga backward compatibility lama ketika ada perubahan pada modul atau perubahan yang terkait dengan proses bisnis

# Barcode Scanner Project

Buatkan program Python menggunakan framework PyQt6 untuk aplikasi barcode scanner. Alat yang digunakan adalah Symbol Barcode Scanner via USB HID (sebagai keyboard). Project directory berada di `barcode-scanner`

### Fitur yang diinginkan

- Interface memiliki satu QLineEdit yang selalu fokus secara otomatis.
- Gunakan event filter atau listener untuk menangkap input barcode yang masuk dengan cepat.
- Setiap kali karakter `Enter` (ASCII 13) terdeteksi (sebagai penanda akhir scan dari alat Symbol), ambil seluruh string barcode tersebut, tampilkan di daftar log pada UI, lalu kosongkan kembali input field-nya.
- Tambahkan fungsi simulasi database sederhana (dictionary) untuk mengecek apakah barcode yang di-scan terdaftar atau tidak.
- Pastikan kode menangani input cepat agar tidak ada karakter yang tertinggal.
