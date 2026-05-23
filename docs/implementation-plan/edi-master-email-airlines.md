# Rencana Implementasi - Master EDI Email Airlines

Menambahkan antarmuka CRUD lengkap untuk mengelola email maskapai penerbangan di bawah "EDI > Master EDI > Email Airlines". Hubungkan fitur ini dengan tombol aksi "Send Email" pada tabel data FFM, FWB, dan FHL agar secara otomatis mengambil alamat email maskapai yang sesuai berdasarkan kode maskapai.

## Peninjauan Pengguna Diperlukan

> [!IMPORTANT]()
>
> - Menu baru bernama "Email Airlines" akan dimasukkan di bawah submenu "Master EDI" (yang memiliki ID parent 49) di database melalui migrasi Alembic.
> - Fungsi SweetAlert2 `promptEmailAddress` di frontend akan diperbarui agar menerima nilai default (prefilled). Ketika tombol "Send Email" diklik, sistem akan memanggil backend, mencari email maskapai yang cocok, memasukkannya ke dalam popup konfirmasi, dan memungkinkan pengguna untuk mengedit/memastikan alamat email tersebut sebelum dikirim.

## Pertanyaan Terbuka

Tidak ada pertanyaan saat ini.

## Rencana Perubahan

---

### Komponen Backend

#### [BARU] [master_airline.py](/materialize-fastapi/app/models/BaseDB1/master_airline.py)

Membuat model SQLAlchemy baru untuk memetakan tabel `master_airlines` yang sudah ada di database.

#### [UBAH] [**init**.py](/materialize-fastapi/app/models/BaseDB1/__init__.py)

Mengimpor model `MasterAirline` di dalam `app/models/BaseDB1/__init__.py`.

#### [BARU] [master_airline_schema.py](/materialize-fastapi/app/schemas/master_airline_schema.py)

Membuat schema Pydantic (`MasterAirlineCreate`, `MasterAirlineUpdate`, `MasterAirlineOut`) untuk validasi request dan serialisasi response.

#### [BARU] [master_airline_repository.py](/materialize-fastapi/app/repositories/master_airline_repository.py)

Membuat repository yang menggunakan `DataTablesService` bawaan untuk menangani pagination, filter, sorting, dan operasi CRUD database standar.

#### [BARU] [master_airline_service.py](/materialize-fastapi/app/services/master_airline_service.py)

Membuat service layer untuk logika bisnis, pemetaan data, dan fungsi pencarian email maskapai berdasarkan kode IATA/ICAO atau nama.

#### [BARU] [master_airline_deps.py](/materialize-fastapi/app/dependencies/master_airline_deps.py)

Menyediakan provider Dependency Injection untuk read/write repository dan service.

#### [UBAH] [edi.py](/materialize-fastapi/app/api/edi.py)

Menambahkan endpoint Master Airlines berikut ke router EDI:

- `POST /edi/email-airlines/datatables`
- `GET /edi/email-airlines`
- `GET /edi/email-airlines/lookup`
- `GET /edi/email-airlines/{id}`
- `POST /edi/email-airlines`
- `PUT /edi/email-airlines/{id}`
- `DELETE /edi/email-airlines/{id}`

#### [BARU] [Migration Script](/materialize-fastapi/migrations/versions/)

Membuat file migrasi Alembic untuk memasukkan menu baru "Email Airlines" di bawah submenu "Master EDI" (parent ID: 49) dengan URL `/edi/email-airlines`.

---

### Komponen Frontend

#### [UBAH] [edi.js](/astro/src/lib/api/edi.js)

Menambahkan fungsi API client helper untuk memanggil endpoint baru.

#### [UBAH] [shared.js](/astro/src/components/react/edi/shared.js)

Memodifikasi helper `promptEmailAddress(title, defaultValue)` agar menerima argumen nilai default untuk pre-fill input email.

#### [BARU] [EmailAirlinesDatatables.jsx](/astro/src/components/react/edi/EmailAirlinesDatatables.jsx)

Membuat komponen React berisi grid data (Datatables) dan formulir CRUD (Tambah/Edit/Hapus) menggunakan modal Bootstrap.

#### [BARU] [email-airlines.jsx](/astro/src/components/react/edi/email-airlines.jsx)

Membuat wrapper React island untuk komponen datatable.

#### [UBAH] [index.js](/astro/src/components/react/edi/index.js)

Mengekspor komponen `EmailAirlines`.

#### [BARU] [email-airlines.astro](/astro/src/pages/edi/email-airlines.astro)

Membuat rute Astro baru di bawah `astro/src/pages/edi/email-airlines.astro`.

#### [UBAH] [FhlDatatables.jsx](/astro/src/components/react/edi/FhlDatatables.jsx)

Memodifikasi tombol aksi "Send Email" untuk memanggil API pencarian email maskapai, menampilkan popup konfirmasi email ter-prefill, memuat preview pesan FHL, dan memanggil `sendEmailEdi`.

#### [UBAH] [fwbDatatables.jsx](/astro/src/components/react/edi/fwbDatatables.jsx)

Memodifikasi tombol aksi "Send Email" untuk memanggil API pencarian email maskapai, menampilkan popup konfirmasi email ter-prefill, memuat preview pesan FWB, dan memanggil `sendEmailEdi`.

#### [UBAH] [ffmDatatables.jsx](/astro/src/components/react/edi/ffmDatatables.jsx)

Memodifikasi tombol aksi "Send Email" untuk memanggil API pencarian email maskapai, menampilkan popup konfirmasi email ter-prefill, memuat preview pesan FFM, dan memanggil `sendEmailEdi`.

---

## Rencana Verifikasi

### Pengujian Otomatis

- Menjalankan migrasi Alembic untuk memverifikasi entri menu "Email Airlines" berhasil ditambahkan.
- Memverifikasi endpoint backend melalui Swagger UI (`/docs`).
- Menjalankan `npm run build` pada folder `astro/` untuk memverifikasi proses build bundler tidak mengalami error linter atau sintaks.

### Manual Verification

- Membuka halaman `EDI > Master EDI > Email Airlines` dan mencoba fungsionalitas CRUD secara menyeluruh (Tambah, Edit, Hapus, Pencarian, dan Status keaktifan).
- Mengklik tombol "Send Email" pada tabel FFM, FWB, dan FHL, memastikan kolom input email terisi otomatis sesuai maskapai baris data terkait, dan memverifikasi email berhasil dikirim melalui log background job.
