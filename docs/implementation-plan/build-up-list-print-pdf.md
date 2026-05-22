# Rencana Implementasi - Modul Build Up List & Cetak PDF (Warehouse)

Dokumen ini menjelaskan rencana teknis untuk mengimplementasikan fitur daftar/tabel Build Up (server-side datatables) dan fitur cetak manifest serta checklist dalam bentuk file PDF dari backend FastAPI.

## Review Pengguna Diperlukan

> [!IMPORTANT]
> **Mekanisme Cetak PDF**: Halaman cetak manifest dan checklist akan menghasilkan file PDF yang diproses secara langsung oleh backend FastAPI (menggunakan library `xhtml2pdf`). 
> - Endpoint cetak menggunakan prefix path `/pdf/warehouse/...` agar bypass middleware JWT header otomatis (`JWTMiddleware`). 
> - Autentikasi dilakukan dengan mengirimkan token sebagai query parameter `?token=...` yang akan divalidasi manual di backend. Hal ini memungkinkan pemanggilan sederhana via `window.open` atau tag `<a>` dari browser untuk mengunduh/membuka file PDF secara native.

> [!NOTE]
> **Layout dan Struktur PDF**:
> - File layout print menggunakan CSS Paper A4 berbasis [a4.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/paper-css/examples/a4.html) yang digabungkan secara inline dengan struktur tabel dari [pdf_build_up.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/pdf_build_up.html).
> - File cetakan baru akan dibuat di [build_up_print_pdf.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/build_up_print_pdf.html).
> - Jika mencetak checklist (`is_checklist=True`), judul berganti menjadi **ULD BUILD UP CHECKLIST** dan ditambahkan blok tanda tangan Staff & Supervisor di bagian bawah. Jika manifest (`is_checklist=False`), judul tetap **AIR CARGO MANIFEST** sesuai template aslinya.

---

## Usulan Perubahan

### 1. Backend FastAPI (`materialize-fastapi/`)

#### [MODIFY] [build_up_check_repository.py](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/repositories/build_up_check_repository.py)
- Menambahkan method `datatable(self, params: DataTablesParams) -> tuple[int, int, list[BuildUpCheckHeader]]` untuk mendukung pencarian, filter custom (`uld`, `airlines`, `flight_no`, `flight_date`, `dest`, `mawb`), sorting dinamis, serta pagination server-side.

#### [MODIFY] [build_up_check_service.py](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/build_up_check_service.py)
- Menambahkan method `build_up_headers_datatable(self, params: DataTablesParams) -> DataTablesResponse[BuildUpCheckHeaderOut]` untuk format data yang sesuai standar Datatables.
- Menambahkan method `generate_build_up_pdf(self, header_id: int, is_checklist: bool) -> bytes` untuk:
  - Mengambil data header, detail MAWB, beserta rincian pieces & berat dari database.
  - Memetakan data database ke dalam objek model/dict `manifest` yang memiliki struktur variabel yang sama persis seperti yang dibutuhkan oleh template [pdf_build_up.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/pdf_build_up.html).
  - Melakukan parser pada string ULD (misal `AKE12345FX`) untuk memecah menjadi `uld_type`, `uld_number`, dan `uld_owner`.
  - Melakukan rendering template baru [build_up_print_pdf.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/build_up_print_pdf.html) menggunakan Jinja2.
  - Mengompilasi HTML tersebut menjadi binary PDF menggunakan `xhtml2pdf` (`pisa.CreatePDF`).

#### [MODIFY] [build_up_check.py](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/api/build_up_check.py)
- Menambahkan endpoint `POST /warehouse/build-up-headers/datatables` untuk data table utama.
- Membuat APIRouter baru `pdf_router = APIRouter(prefix="/pdf/warehouse", tags=["PDF Print"])` tanpa dependensi `require_authenticated_user` global.
- Menambahkan route berikut di `pdf_router`:
  - `GET /build-up-headers/{header_id}/pdf-manifest`
  - `GET /build-up-headers/{header_id}/pdf-checklist`
  - Kedua route ini menerima query parameter `token: str` dan memanggil fungsi utilitas pembantu untuk men-decode token guna otorisasi sebelum mengembalikan file PDF (`Response(content=pdf_bytes, media_type="application/pdf")`).

#### [MODIFY] [routes.py](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/api/routes.py)
- Meregistrasikan `build_up_check.pdf_router` ke dalam route utama agar bisa diakses.

#### [NEW] [build_up_print_pdf.html](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/templates/build_up_print_pdf.html)
- File template baru yang menggabungkan kerangka dokumen Paper CSS A4 (`<body class="A4">`, `<section class="sheet padding-10mm">`), style CSS terpadu dari `air_cargo_manifest.css`, dan seluruh struktur tabel detail isi ULD/MAWB dari `pdf_build_up.html`.
- Menyertakan logic dinamis untuk judul dan tanda tangan berdasarkan variabel `is_checklist`.

---

### 2. Frontend Astro (`astro/`)

#### [NEW] [warehouse.js](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/lib/api/warehouse.js)
- File pemanggil API untuk Datatables Build Up List.

#### [NEW] [BuildUpListDatatables.jsx](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/components/react/warehouse/BuildUpListDatatables.jsx)
- Komponen React berisi filter pencarian kustom (ULD, Airline, Flight No, Flight Date, Destination, MAWB) dan tabel grid `<GridData />`.
- Kolom tabel menampilkan: ULD, Airline, Flight No, Flight Date, Dest, Staff, Supervisor, Pieces, Status Badge, dan Actions (tombol **Print Manifest** dan **Print Checklist**).
- Tombol cetak memicu `window.open` ke endpoint backend `/api/pdf/warehouse/build-up-headers/{id}/pdf-manifest?token={getAccessToken()}`.

#### [NEW] [build-up-list.astro](file:///c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/pages/warehouse/build-up-list.astro)
- Halaman Astro tunggal yang dipasang di `astro/src/pages/warehouse/build-up-list.astro`. Menggunakan layout admin `AdminLayout` dan me-mount `<BuildUpListDatatables client:only="react" />`.

---

## Rencana Verifikasi

### Otomatis (Linter & Compiling)
- Jalankan pemeriksaan backend:
  `poetry run ruff check app/api/build_up_check.py app/services/build_up_check_service.py app/repositories/build_up_check_repository.py`
- Jalankan verifikasi kompilasi python:
  `python -m py_compile app/api/build_up_check.py app/services/build_up_check_service.py app/repositories/build_up_check_repository.py`
- Build frontend Astro:
  `npm run build` di dalam folder `astro/`

### Manual (Uji Coba Fungsi)
- Masuk ke halaman `/warehouse/build-up-list`.
- Tes filter pencarian dan pastikan filter dikirim ke backend dengan benar.
- Klik tombol **Print Manifest** dan **Print Checklist**; verifikasi dokumen PDF terbuka di tab baru dan terformat secara sempurna dengan layout Paper A4.
