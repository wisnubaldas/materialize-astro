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