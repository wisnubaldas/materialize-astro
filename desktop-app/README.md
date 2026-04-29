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

## Qt Material + Designer

Catatan penting:
- Saat file `.ui` dibuka langsung di Qt Designer, stylesheet runtime dari aplikasi tidak otomatis terpasang.
- Tampilan final yang akurat adalah saat `.ui` dijalankan lewat runtime app/preview script.

Perintah preview `.ui` dengan tema yang sama seperti aplikasi:

```bash
python scripts/preview_ui.py app/resources/ui/login_view.ui
```

Export stylesheet resolved untuk preview di Qt Designer:

```bash
python scripts/export_designer_qss.py
```

File output:
- `app/resources/styles/qt_material_designer_preview.qss`

Gunakan file QSS tersebut di Qt Designer (preview stylesheet) bila ingin tampilan mendekati runtime.
