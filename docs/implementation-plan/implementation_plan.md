# Memindahkan Modul Logging ke Settings

Memindahkan halaman logging dan endpoint backend SSE terkait dari modul `hubnet` ke modul `setting` untuk merapikan organisasi kode dan menyelesaikan masalah MIME type error saat hidrasi iconify di modul hubnet. Pembaruan URL menu di database akan dilakukan secara manual oleh pengguna.

## Tinjauan Pengguna Diperlukan

> [!NOTE]
> Pemindahan endpoint logging di backend membutuhkan penambahan `/setting/log-app` sebagai jalur pengecualian (bypass) di middleware otentikasi backend, karena koneksi `EventSource` di browser tidak dapat menyertakan header otentikasi dengan mudah.

## Pertanyaan Terbuka

Tidak ada pertanyaan terbuka.

## Rencana Perubahan

---

### [Komponen: Backend API]

#### [MODIFY] [setting.py](/materialize-fastapi/app/api/setting.py)

- Impor `asyncio`, `json`, `logging`, `Request`, `StreamingResponse`, `HTTPException`, `decrypt_key`, dan `SSEUTIL`.
- Definisikan `LOG_PATH = "logs/app.log"`.
- Pindahkan fungsi generator `__log_event_stream()` dan endpoint `@router.get("/log-app")` ke file ini, sehingga jalurnya menjadi `/setting/log-app`.

#### [MODIFY] [sse.py](/materialize-fastapi/app/api/sse.py)

- Hapus route `log_app`, fungsi pembantu `__log_event_stream()`, dan variabel `LOG_PATH`.

#### [MODIFY] [auth_middleware.py](/materialize-fastapi/app/api/middleware/auth_middleware.py)

- Tambahkan pemeriksaan bypass untuk `/setting/log-app` di `JWTMiddleware.dispatch`.

---

### [Komponen: Frontend Web App]

#### [NEW] [logging.astro](/astro/src/pages/setting/logging.astro)

- Tambahkan halaman Astro untuk logging settings menggunakan `BaseLayout` dan mengimpor `SseDataTracking` dari `@components/setting`.
- Atur judul layout menjadi "Setting | Logging".

#### [DELETE] [logging.astro](/astro/src/pages/hub-net/logging.astro)

- Hapus halaman logging lama di bawah `/hub-net`.

#### [NEW] [SseDataTracking.jsx](/astro/src/components/react/setting/SseDataTracking.jsx)

- Pindahkan `SseDataTracking.jsx` ke dalam direktori komponen setting.
- Definisikan `isBrowser` secara lokal.
- Impor `resolveErrorMessage` dari `./shared.js`.

#### [DELETE] [SseDataTracking.jsx](/astro/src/components/react/hubnet/SseDataTracking.jsx)

- Hapus komponen tersebut dari direktori komponen hubnet.

#### [MODIFY] [index.js](/astro/src/components/react/setting/index.js)

- Ekspor `SseDataTracking` dari file index setting.

#### [MODIFY] [index.js](/astro/src/components/react/hubnet/index.js)

- Hapus ekspor `SseDataTracking` dari file index hubnet.

#### [MODIFY] [sse.js](/astro/src/lib/api/sse.js)

- Perbarui jalur target `/sse/log-app` menjadi `/setting/log-app`.

---

## Pembersihan Kode (Code Cleanup)

Setelah proses migrasi dan pemindahan file selesai, langkah pembersihan berikut akan dilaksanakan:

- **Dead Code / Unused Imports & Exports**: Hapus ekspor lama `SseDataTracking` di `astro/src/components/react/hubnet/index.js`, dan bersihkan impor yang tidak digunakan di file `sse.py`.
- **Legacy & Deprecated Components**: Pastikan tidak ada file sementara atau sisa duplikasi komponen di folder `hubnet` (khususnya file `SseDataTracking.jsx` lama yang telah dihapus).
- **Code Cruft**: Cek file index di hubnet dan setting untuk memastikan hanya mengekspor komponen yang aktif dan benar.

---

## Rencana Verifikasi

### Pengujian Otomatis

- Jalankan `npm run build` di direktori frontend untuk memastikan build berhasil dan masalah hidrasi chunk selesai sepenuhnya.
- Jalankan Ruff linting/checking pada file Python backend yang diubah.

### Verifikasi Manual

- Verifikasi bahwa mengakses `/setting/logging` di frontend memulai koneksi SSE ke `/setting/log-app?key=...` dan menampilkan output log dari backend dengan benar.
