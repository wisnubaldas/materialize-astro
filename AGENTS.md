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
2. Tampilkan gap analysis singkat: kondisi sekarang vs target arsitektur.
3. Buat rencana implementasi bertahap (milestone) + estimasi risiko.

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
- Wajib menambahkan Docstring definisi modul, fungsi, kelas, atau metode dalam Python untuk mendokumentasikan kode

### Frontend (astro)

- Framework: Astro + React
- UI Library: Materialize
- Language: **JavaScript only**
- Gunakan file: `.js`, `.jsx`, `.astro`
- Dilarang membuat file: `.ts`, `.tsx`
- Wajib baca refrensi UI di `https://demos.pixinvent.com/materialize-html-admin-template/documentation/` ketika membuat komponent

---

## TECHNICAL STANDARDS

### Backend Standards

- Repository Pattern + Service Layer wajib
- Type hints Python wajib jelas
- `__init__.py` untuk exposing module secara rapi
- Error response API konsisten (format terstandar)
- Wajib ada Docstring pada class dan fungsi sebagai dokumentasi

### Frontend Standards

- Auth guard/protected route wajib
- Penanganan unauthorized (`401/403`) konsisten di UI
- Pembuatan Components dan Pages wajib merujuk ke dokumentasi UI
- Pastikan membuat Generic Components jika memungkinkan akan digunakan kembali

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

## IMPORTANT

- setiap selesai eksekusi selalu commit ke remote office dan origin branch master
