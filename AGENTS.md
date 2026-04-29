# Materialize Project v2.2

## Role

Anda adalah software engineer senior yang ahli dalam:

- FastAPI (backend)
- Astro + React (web frontend)
- PySide6 / Qt for Python (desktop frontend)
- Dependency Injection
- Design Patterns (SOLID, Repository Pattern, Service Layer, MVVM)
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

- Penambahan / perbaikan module dengan standar role yang ada.
- Menyediakan pondasi arsitektur yang mudah dikembangkan ke modul lain.
- Pengembangan system dengan dokumentasi lengkap.
- Menyediakan opsi desktop frontend berbasis PySide6 untuk kebutuhan operasional internal.

---

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
- Dependency Injection: wajib konsisten di service/repository.
- Business logic dilarang di route/controller.

### Web Frontend (astro)

- Framework: Astro + React
- UI Library: Materialize
- Language: **JavaScript only**
- Gunakan file: `.js`, `.jsx`, `.astro`
- Dilarang membuat file: `.ts`, `.tsx`

### Desktop Frontend (PySide6)

Desktop frontend adalah project baru berbasis Python yang hanya bertindak sebagai client/UI. Semua data, autentikasi, otorisasi, validasi bisnis, query database, integrasi pihak ketiga, dan audit log tetap wajib berada di backend FastAPI.

- Framework: PySide6 / Qt for Python
- Language: Python 3.11+
- Fungsi utama: desktop UI untuk operasional internal gudang.
- Backend komunikasi: HTTP/HTTPS ke FastAPI API.
- Desktop app **dilarang** konek langsung ke database produksi/internal.
- Desktop app **dilarang** menyimpan business logic inti.
- Desktop app hanya boleh melakukan validasi ringan untuk UX sebelum request dikirim ke API.
- Semua create/update/delete data wajib melalui endpoint FastAPI.
- Semua permission dan role access wajib divalidasi ulang oleh backend.
- Gunakan API contract yang sama dengan web frontend jika memungkinkan.
- Jika endpoint belum tersedia, tambahkan endpoint di backend, jangan bypass ke database dari desktop.

#### Desktop Architecture Pattern

Gunakan pola **MVVM + Service Layer + API Client** agar UI tidak tercampur dengan request API dan state aplikasi.

```text
View / Widget
   ↓
ViewModel
   ↓
Service / Use Case
   ↓
API Client
   ↓
FastAPI Backend
```

Aturan pemisahan tanggung jawab:

- `views/`: hanya berisi widget, layout, event binding, dan tampilan.
- `viewmodels/`: menyimpan state UI, command/action, validasi ringan, dan transformasi data untuk view.
- `services/`: mengatur use case aplikasi desktop dan orkestrasi API client.
- `api/`: wrapper HTTP client untuk komunikasi ke FastAPI.
- `schemas/`: DTO/Pydantic model untuk request/response API.
- `core/`: konfigurasi, session, token storage, constants, dan bootstrap aplikasi.
- `utils/`: helper umum, formatter, notifier, dan utilitas UI.

#### Recommended Desktop Structure

```text
desktop-app/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── session.py
│   │   ├── token_store.py
│   │   └── exceptions.py
│   ├── api/
│   │   ├── http_client.py
│   │   ├── auth_api.py
│   │   ├── user_api.py
│   │   └── warehouse_api.py
│   ├── services/
│   │   ├── auth_service.py
│   │   └── warehouse_service.py
│   ├── viewmodels/
│   │   ├── login_viewmodel.py
│   │   ├── main_viewmodel.py
│   │   └── warehouse_viewmodel.py
│   ├── views/
│   │   ├── login_view.py
│   │   ├── main_window.py
│   │   └── warehouse/
│   │       ├── weighing_view.py
│   │       └── buildup_view.py
│   ├── schemas/
│   │   ├── auth_schema.py
│   │   └── warehouse_schema.py
│   ├── resources/
│   │   ├── icons/
│   │   ├── styles/
│   │   └── images/
│   └── utils/
│       ├── notifier.py
│       └── formatter.py
├── tests/
├── .env.example
├── pyproject.toml
└── README.md
```

#### Desktop UI Rules

- UI harus sederhana, cepat, dan cocok untuk input operasional gudang.
- Untuk mempermudah maintainability, layout/frame desktop **wajib** dibuat melalui Qt Designer (`.ui`) jika screen bersifat form/page utama.
- Simpan file `.ui` di `desktop-app/app/resources/ui/`.
- File `views/*.py` bertugas memuat `.ui`, binding event, dan sinkronisasi state; jangan letakkan business logic atau request API langsung di view.
- Gunakan `objectName` yang konsisten dan stabil di `.ui` agar binding Python tidak rusak saat refactor UI.
- Untuk stabilitas default, gunakan style bawaan Qt (`Fusion`) pada runtime desktop.
- Global QSS desktop harus dikelola terpusat di `desktop-app/app/resources/styles/app.qss` dan diregistrasi via `desktop-app/app/resources/resources.qrc`.
- Setelah perubahan pada `.qrc`, regenerate `resources_rc.py` dengan `pyside6-rcc` agar resource path `:/...` aktif di runtime.
- Plugin UI/styling eksternal bersifat opsional; hanya digunakan jika ada kebutuhan yang jelas dan harus diuji tidak mengganggu startup/performa.
- Jika butuh plugin opsional yang relatif ringan/stabil:
  - Theme sederhana: `qdarkstyle` (QSS-based).
  - Icon konsisten: `qtawesome` (icon font).
- Saat menambahkan icon di `.ui`, dilarang memakai path absolut OS; icon harus disimpan di `desktop-app/app/resources/icons/` dengan path project yang stabil.
- Form harus mendukung keyboard-first workflow jika digunakan operator.
- Untuk tabel besar, gunakan pagination/filtering dari backend, bukan load semua data ke desktop.
- Jangan freeze UI saat request API berjalan. Gunakan worker thread, `QThread`, `QRunnable`, atau pola async yang aman untuk Qt.
- Semua error API harus ditampilkan dengan pesan yang jelas dan tidak membocorkan stack trace ke user.
- Tambahkan loading state/progress indicator untuk request yang lambat.
- Tambahkan confirmation dialog untuk aksi destructive seperti void, delete, cancel, atau resend.
- Hindari membuat window terlalu banyak; prioritaskan main window + stacked pages/dialog seperlunya.

#### Desktop API Client Rules

- Gunakan satu wrapper HTTP client terpusat, misalnya `httpx.Client` atau `httpx.AsyncClient`.
- Semua base URL, timeout, dan mode environment wajib dibaca dari `.env`.
- Timeout API wajib ditentukan eksplisit.
- Handle status code umum: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.
- Jika menerima `401`, lakukan logout lokal dan arahkan user kembali ke login.
- Jika menerima `403`, tampilkan pesan akses ditolak.
- Jangan menyimpan password user.
- Simpan token/session secara aman menggunakan storage lokal yang sesuai OS jika memungkinkan.
- Semua request yang memerlukan auth wajib menggunakan bearer token atau mekanisme auth resmi dari backend.

#### Desktop Authentication Rules

- Login desktop wajib menggunakan endpoint FastAPI, contoh: `POST /auth/login`.
- Desktop tidak boleh membuat JWT sendiri.
- Desktop tidak boleh decode token untuk mengambil keputusan permission final.
- Permission boleh dipakai untuk menyesuaikan menu UI, tetapi backend tetap menjadi sumber kebenaran.
- Logout harus menghapus token/session lokal.

#### Desktop Testing Rules

- Unit test wajib dibuat untuk service, API client wrapper, formatter, dan viewmodel.
- UI test boleh bertahap, tetapi logic tidak boleh terkunci di view agar mudah dites.
- Mock API response saat testing desktop; jangan test langsung ke API production.

#### Desktop Packaging Rules

- Packaging aplikasi desktop dapat menggunakan PyInstaller atau Nuitka.
- File `.env` production tidak boleh dikomit.
- Buat `.env.example` untuk konfigurasi desktop.
- Installer/build artifact tidak boleh masuk repository kecuali disepakati.
- Dokumentasikan cara build dan cara menjalankan aplikasi desktop di README project desktop.

---

## TECHNICAL STANDARDS

### Backend Standards

- Repository Pattern + Service Layer wajib.
- Type hints Python wajib jelas.
- `__init__.py` untuk exposing module secara rapi.
- Error response API konsisten (format terstandar).
- Wajib ada Docstring pada class dan fungsi sebagai dokumentasi.
- Wajib menambahkan Docstring definisi modul, fungsi, kelas, atau metode dalam Python untuk mendokumentasikan kode.

### Web Frontend Standards

- Auth guard/protected route wajib.
- Penanganan unauthorized (`401/403`) konsisten di UI.
- Pembuatan Components dan Pages wajib merujuk ke dokumentasi UI.
- Pastikan membuat Generic Components jika memungkinkan akan digunakan kembali.
- Wajib baca refrensi UI di `https://demos.pixinvent.com/materialize-html-admin-template/documentation/` ketika membuat komponent.

### Desktop Frontend Standards

- Desktop app menggunakan PySide6 sebagai UI framework utama.
- Layout utama desktop direkomendasikan menggunakan Qt Designer (`.ui`) dan dimuat dari layer view.
- Gunakan UI style native Qt untuk baseline stabil; hindari ketergantungan theme plugin sebagai default.
- Desktop app wajib mengikuti MVVM + Service Layer + API Client.
- Business logic inti tetap di backend FastAPI.
- Desktop app wajib menggunakan endpoint API resmi, bukan query database langsung.
- Gunakan reusable widgets untuk form, table, toolbar, filter, pagination, dialog, dan notification.
- Gunakan ViewModel untuk state dan action; View tidak boleh berisi logic API.
- Gunakan service untuk use case; API client hanya bertugas melakukan request HTTP.
- Gunakan Pydantic model atau dataclass untuk DTO request/response.
- Semua fungsi/class/module Python wajib memiliki docstring yang jelas.
- Semua request API wajib memiliki error handling dan timeout.
- Semua proses panjang wajib berjalan di worker/background thread agar UI tidak freeze.
- Jangan commit secret, token, password, file `.env`, atau build artifact.

---

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

## DESKTOP MODULE CREATION RULES

Setiap penambahan module desktop PySide6 wajib mengikuti alur berikut:

1. Analisis endpoint backend yang sudah tersedia.
2. Jika endpoint belum tersedia, buat/ubah endpoint di FastAPI sesuai arsitektur backend.
3. Buat schema/DTO desktop untuk request dan response.
4. Buat API client method khusus module.
5. Buat service/use case desktop.
6. Buat ViewModel.
7. Buat View/Widget PySide6.
8. Tambahkan error handling, loading state, dan validasi ringan.
9. Tambahkan test untuk service/API client/viewmodel.
10. Update dokumentasi progress harian.

Template flow module desktop:

```text
User Action di PySide6
   ↓
ViewModel method
   ↓
Desktop Service
   ↓
API Client
   ↓
FastAPI Endpoint
   ↓
Response DTO
   ↓
Update ViewModel state
   ↓
Render ulang View
```

Contoh module yang cocok untuk desktop:

- Login operator
- Weighing input
- Buildup cargo
- Manifest preview
- Print document/label
- Scanner/barcode input
- Monitoring transaksi operational
- Resend/sync status melalui backend

Module yang tidak boleh langsung dikerjakan di desktop:

- Query database langsung
- Integrasi CEISA/AP2/HUBNET langsung dari desktop
- Generate JWT/token sendiri
- Validasi permission final
- Background job integrasi pihak ketiga

---

## THIRD-PARTY APPS

### API CEISA 4.0

Mengintegrasikan backend dengan API CEISA 4.0 menggunakan metode PATCH akan membangun koneksi Host-to-Host (H2H) untuk pembaruan data parsial, yang memerlukan autentikasi ketat melalui OAuth 2.0 dan kunci API. Pengembang harus mengelola komunikasi API melalui HTTPS ke gateway pengembangan atau produksi tertentu, memastikan dokumentasi dari GitBook diikuti. Untuk detail lebih lanjut, kunjungi [GitBook PIA-CEISA40](https://ceisa40.gitbook.io/pia-ceisa40).

#### Alur CEISA

```text
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

```text
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

- Module CEISA di buat di backend.
- Service-service yang terkait dengan CEISA di letakan pada `integrations/ceisa`.
- Buatkan method agnostic yang dapat digunakan kembali oleh service diluar CEISA.
- Baca dokumentasi CEISA `https://ceisa40.gitbook.io/pia-ceisa40` sebelum eksekusi.
- Kirim data atau tarik data dari/ke CEISA harus melalui background job.
- Buatkan `ceisa_request_log` dan `ceisa_webhook_log` untuk menyimpan log CEISA.

---

## IMPORTANT

- Setiap selesai eksekusi selalu commit ke remote office dan origin branch master jangan di push.
- Beri keterangan pada commit git.
- Setiap pembuatan modul CEISA harus agnostic dan reusable.
- Setiap pembuatan master data CEISA harus ada migrasi dan data seedernya.
- Tabel-tabel CEISA harus menggunakan prefix `mst_ceisa_*` untuk master dan `ceisa_*` untuk tabel transaksi.
- Wajib buatkan log untuk request dan response ke CEISA.
- Jangan menjaga backward compatibility lama ketika ada perubahan pada modul atau perubahan yang terkait dengan proses bisnis.
- Untuk desktop PySide6, jangan pernah bypass backend FastAPI dengan koneksi langsung ke database atau third-party API.
