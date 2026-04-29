# Milestone Analysis - Desktop App Initial Setup

## Tanggal
2026-04-29

## Kondisi Codebase Saat Ini
- Repository sudah memiliki backend `materialize-fastapi` dan web frontend `astro`.
- Endpoint autentikasi backend sudah tersedia dan bisa dipakai ulang untuk desktop:
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`
- Belum ada project desktop `desktop-app/` berbasis PySide6 di root repository.
- Belum ada implementasi pola MVVM + Service Layer + API Client untuk client desktop.

## Gap Analysis (Current vs Target)
- Current: Tidak ada aplikasi desktop operasional.
  Target: Desktop app PySide6 siap dikembangkan untuk module gudang.
- Current: Belum ada API wrapper terpusat di sisi desktop.
  Target: `HttpClient` terpusat dengan timeout eksplisit dan mapping status code umum (`400/401/403/404/409/422/429/500`).
- Current: Belum ada alur login desktop ke backend resmi.
  Target: Login desktop menggunakan `POST /auth/login` dan profile via `GET /auth/me`.
- Current: Belum ada pemisahan View, ViewModel, Service, dan API Client.
  Target: Struktur MVVM penuh untuk mencegah business logic masuk ke UI.
- Current: Belum ada unit test desktop.
  Target: Unit test minimal untuk formatter, HTTP wrapper, service auth, dan login viewmodel.

## Rencana Implementasi Bertahap (Milestone)
1. Membuat struktur project `desktop-app` sesuai standar AGENTS.md.
2. Menambahkan layer `core`, `schemas`, `api`, `services`, `viewmodels`, `views`, `utils`, dan `resources`.
3. Implementasi login flow desktop ke FastAPI tanpa bypass database.
4. Menambahkan worker `QThread` untuk request API agar UI tidak freeze.
5. Menambahkan halaman utama awal (dashboard + placeholder warehouse pages).
6. Menambahkan unit test awal untuk layer non-UI.
7. Menambahkan dokumentasi penggunaan dan konfigurasi environment desktop.

## Estimasi Risiko
- Risiko: Dependency GUI (`PySide6`, `qt-material`) belum terpasang di environment lokal.
  Mitigasi: Sediakan `pyproject.toml`, `.env.example`, dan instruksi setup di README.
- Risiko: Endpoint backend saat runtime tidak sesuai base URL local.
  Mitigasi: Konfigurasi `MAU_API_BASE_URL` wajib melalui `.env`.
- Risiko: UI freeze jika request dijalankan di main thread.
  Mitigasi: Jalankan request login melalui worker `QThread`.
- Risiko: Token persistence berbeda antar OS.
  Mitigasi: Gunakan keyring sebagai prioritas, fallback file lokal terisolasi bila keyring unavailable.