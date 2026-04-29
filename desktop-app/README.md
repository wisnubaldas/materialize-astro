# MAU Desktop App

Desktop frontend untuk MAU APP berbasis PySide6 dengan pola MVVM + Service Layer + API Client.

## Struktur

```text
desktop-app/
├── app/
├── tests/
├── .env.example
├── pyproject.toml
└── README.md
```

## Menjalankan Aplikasi

1. Masuk ke folder `desktop-app`.
2. Buat virtual environment Python 3.11+.
3. Install dependency.
4. Copy `.env.example` menjadi `.env` dan sesuaikan `MAU_API_BASE_URL`.
5. Jalankan aplikasi.

Contoh:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
copy .env.example .env
python -m app.main
```

## Menjalankan Mode Debug

1. Pastikan file `desktop-app/.env` ada (copy dari `.env.example`).
2. Set `MAU_APP_DEBUG=true`.
3. Jalankan dari terminal di folder `desktop-app`.

Contoh:

```bash
set MAU_APP_DEBUG=true
python -X dev -m app.main
```

Saat debug aktif, terminal akan menampilkan:
- log konfigurasi (`API base URL`, timeout),
- log request HTTP (`httpx/httpcore`),
- traceback lengkap jika worker thread gagal.

Jika login loading lama, cek dulu nilai `MAU_API_BASE_URL` pada `desktop-app/.env`.

## Menjalankan Test

```bash
pytest
```

## Catatan Arsitektur

- Semua data dan business logic tetap berada di backend FastAPI.
- Desktop app hanya melakukan validasi ringan untuk UX.
- Semua request API memakai `HttpClient` terpusat dengan timeout eksplisit.
- Login menggunakan endpoint resmi backend: `POST /auth/login`.
- Request jaringan dijalankan di background thread (`QThread`) agar UI tidak freeze.

## Workflow Qt Designer

- Layout/frame dikelola di file `.ui` pada `app/resources/ui`.
- View Python memuat `.ui` via `app/views/ui_loader.py`, lalu melakukan event binding ke ViewModel.
- Panduan detail ada di:
  - `desktop-app/docs/qt-designer-integration.md`
