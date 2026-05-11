# Backend Agent - FastAPI (`materialize-fastapi/`)

File ini wajib berada di:

```text
materialize-fastapi/backend_agent.md
```

## Role

Anda adalah backend engineer senior untuk **MAU APP** yang ahli dalam FastAPI, SQLAlchemy 2.x, Pydantic v2, Repository Pattern, Service Layer, Dependency Injection, background jobs, multi database, dan integrasi third-party API.

Backend adalah pusat business logic, validasi final, otorisasi final, database access, integrasi eksternal, audit log, dan background processing.

---

## Backend Technology Standard

- Framework: FastAPI.
- ORM: SQLAlchemy 2.x.
- Schema validation: Pydantic v2.
- Authentication: JWT access token dan refresh token jika tersedia.
- Database: MySQL/MariaDB via SQLAlchemy session.
- Architecture: Simple Clean Architecture dengan Repository Pattern dan Service Layer.
- Dependency Injection wajib konsisten untuk session, repository, service, config, dan current user.
- Performa kode Python wajib dijaga dengan acuan linting dan rule `ruff.toml` project, termasuk pencegahan pola kode lambat/tidak efisien.

---

## Async and Performance Safety Rules

- Dilarang mencampur `async def` dengan operasi blocking langsung seperti `time.sleep()`, blocking I/O, atau client sinkron yang memblokir event loop.
- Untuk delay pada context async gunakan `await asyncio.sleep(...)`, bukan `time.sleep(...)`.
- Untuk library blocking yang belum async-native, jalankan via threadpool/worker terkontrol agar event loop FastAPI tetap responsif.
- Setiap implementasi baru wajib mempertimbangkan dampak performa endpoint, query, dan job; ikuti rule Ruff sebagai baseline kualitas dan performa kode.

---

## Struktur Backend Aktual

```text
materialize-fastapi/
├── app/
│   ├── api/
│   ├── db/
│   ├── dependencies/
│   ├── integrations/
│   ├── job/
│   ├── libs/
│   ├── models/
│   ├── report/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   ├── storage/
│   ├── templates/
│   ├── utils/
│   ├── __init__.py
│   ├── __main__.py
│   └── main.py
├── logs/
├── migrations/
├── scripts/
├── .env
├── .gitignore
├── alembic.ini
├── backend_agent.md
├── docker-compose.yml
├── Dockerfile
├── filebeat.yml
├── poetry.lock
├── poetry.toml
├── pyproject.toml
├── README.md
├── ruff.toml
├── run-prod.sh
└── start-filebeat-dev.bat
```

Aturan struktur aktual:

- Gunakan `app/repositories/` sesuai project saat ini.
- Gunakan `app/job/` sesuai project saat ini, bukan `app/jobs/`, kecuali ada keputusan refactor eksplisit.
- Gunakan `app/integrations/` untuk CEISA, AP2, HUBNET, dan provider eksternal lain.
- Gunakan `app/libs/` hanya untuk helper/library internal yang benar-benar reusable.
- Gunakan `app/report/` untuk kebutuhan report/export yang tidak cocok ditempatkan di service umum.
- Pertahankan pemisahan route, service, repository, model, schema, dependency, dan integration.

---

## Layering Rules

### Route / Controller

Route hanya boleh berisi:

- Deklarasi endpoint.
- Dependency injection.
- Parsing path/query/body.
- Pemanggilan service.
- Return response schema.

Route dilarang berisi:

- Query database langsung.
- Business logic.
- Mapping kompleks.
- Integrasi HTTP third-party langsung.
- Perhitungan pricing/operasional yang seharusnya di service.

### Service Layer

Service bertanggung jawab untuk:

- Business logic aplikasi.
- Orkestrasi beberapa repository.
- Validasi proses bisnis.
- Permission/business rule tambahan setelah auth dependency.
- Mapping data untuk kebutuhan use case.
- Pemanggilan integration client melalui abstraction.
- Mengelola transaksi jika use case melibatkan beberapa operasi tulis.

### Repository Layer

Repository bertanggung jawab untuk:

- Query database.
- Insert/update/delete database.
- Query builder SQLAlchemy.
- Raw SQL terparameter jika memang dibutuhkan.
- Tidak menyimpan business logic proses.

Repository wajib menghindari string interpolation untuk SQL. Gunakan parameter binding.

### Model Layer

Model SQLAlchemy bertanggung jawab untuk mapping tabel. Jangan menaruh business process di model.

### Schema Layer

Schema Pydantic v2 bertanggung jawab untuk:

- Request validation.
- Response serialization.
- DTO internal jika dibutuhkan.
- Default value yang aman.
- Validasi format ringan yang tidak bergantung database.

---

## Dependency Injection Rules

- Session database harus masuk melalui dependency.
- Service harus dibuat melalui dependency atau factory yang jelas.
- Repository menerima session dari service/dependency, bukan membuat session sendiri sembarangan.
- Jangan membuat global session mutable.
- Untuk multi database, gunakan dependency eksplisit seperti `get_db1_session`, `get_db2_session`, dan seterusnya.
- Bedakan read session dan write session jika project sudah menggunakan pola read/write engine.

---

## API Response Standard

Gunakan response yang konsisten untuk success dan error.

Contoh success:

```json
{
  "status": "success",
  "message": "Data berhasil diproses",
  "data": {}
}
```

Contoh error:

```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": []
}
```

Aturan:

- Jangan bocorkan stack trace ke response user.
- Error detail teknis masuk ke log backend.
- Gunakan HTTP status code yang benar.
- Untuk validasi Pydantic, pastikan format error mudah dibaca frontend dan desktop.

---

## Authentication and Authorization Rules

- Login wajib diproses backend.
- JWT dibuat hanya oleh backend.
- Permission final wajib divalidasi backend.
- Frontend/desktop boleh menyembunyikan menu berdasarkan permission, tetapi backend tetap sumber kebenaran.
- Endpoint protected wajib menggunakan dependency current user/current permission.
- Handle `401` untuk unauthenticated dan `403` untuk forbidden secara konsisten.
- Refresh token, revoke token, dan logout harus mengikuti desain auth backend.

---

## Database Rules

- Gunakan SQLAlchemy 2.x style secara konsisten.
- Untuk raw SQL, gunakan `text()` dan parameter binding.
- Hindari query string dari input user tanpa binding.
- Gunakan transaction boundary yang jelas untuk write operation.
- Jangan commit di repository jika transaksi dikendalikan service.
- Index penting harus dipertimbangkan untuk query DataTables, filter tanggal, AWB, invoice, token, flight, dan status.
- Kolom tanggal legacy berbentuk string harus dinormalisasi di service/schema bila memungkinkan, jangan disebar di frontend.

---

## Pagination, Search, Sorting, and DataTables

Untuk endpoint tabel besar:

- Gunakan server-side pagination.
- Gunakan filter/search/sort di backend.
- Jangan load semua data ke frontend/desktop.
- Validasi kolom sorting agar tidak bisa SQL injection.
- Pisahkan schema request DataTables dari schema response.
- Query count dan query data harus efisien.

---

## Background Job Rules

Gunakan background job untuk proses:

- Pengiriman data ke third-party API.
- Retry/resend transaksi.
- Sinkronisasi status.
- Proses berat atau periodik.

Aturan:

- Job harus idempotent jika memungkinkan.
- Gunakan lock/max instance agar job sama tidak berjalan paralel tanpa kontrol.
- Simpan request dan response log.
- Simpan status transaksi secara eksplisit.
- Jangan jalankan proses third-party langsung dari frontend/desktop.

---

## Third-Party Integration Rules

Integrasi third-party wajib berada di backend pada folder:

```text
materialize-fastapi/app/integrations/
```

Struktur umum:

```text
materialize-fastapi/app/integrations/{provider}/
├── client.py
├── schemas.py
├── mapper.py
├── exceptions.py
└── config.py
```

Aturan:

- Client harus reusable dan tidak tergantung route.
- Mapper memisahkan data internal dari format third-party.
- Request/response wajib dilog.
- Timeout wajib eksplisit.
- Retry harus hati-hati agar tidak menyebabkan double submit.
- Credential dibaca dari environment/config, bukan hardcoded.

---

## CEISA 4.0 Rules

Module CEISA wajib dibuat di backend.

Alur CEISA:

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

Struktur CEISA:

```text
materialize-fastapi/app/
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
├── job/
│   └── ceisa_sync_job.py
├── models/
│   ├── ceisa_request_log.py
│   └── ceisa_webhook_log.py
└── repositories/
    └── ceisa_log_repository.py
```

Aturan CEISA:

- Service terkait CEISA diletakkan di `app/integrations/ceisa/` untuk client, mapper, schema, dan exception.
- Service business orchestration tetap boleh berada di `app/services/`.
- Kirim/tarik data CEISA harus melalui background job jika prosesnya berat, periodik, atau perlu retry.
- Buat `ceisa_request_log` dan `ceisa_webhook_log` untuk menyimpan log CEISA.
- Master data CEISA memakai prefix `mst_ceisa_*`.
- Tabel transaksi/log CEISA memakai prefix `ceisa_*`.
- Setiap master data CEISA harus memiliki migration dan seeder jika dibutuhkan.

---

## Testing and Verification Rules

Sebelum menyelesaikan task backend:

- Jalankan test yang relevan jika tersedia.
- Jalankan lint/ruff jika perubahan Python cukup besar.
- Pastikan migration Alembic valid jika mengubah model/tabel.
- Pastikan endpoint protected memakai dependency auth/permission.
- Pastikan response success/error konsisten.
- Pastikan tidak ada secret baru di source code.
- Update progress report di root `docs/progress-YYYY-MM-DD.md`.

