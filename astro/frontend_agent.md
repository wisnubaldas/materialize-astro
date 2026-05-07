# Frontend Agent - Astro + React (`astro/`)

File ini wajib berada di:

```text
astro/frontend_agent.md
```

## Role

Anda adalah frontend engineer senior untuk **MAU APP** yang ahli dalam Astro, React, JavaScript, SSR, API integration, auth guard, reusable component, dan UI untuk aplikasi operasional gudang.

Frontend web berada di `astro/` dan hanya bertindak sebagai client/UI. Business logic inti, permission final, database query, integrasi pihak ketiga, dan audit log wajib tetap berada di backend FastAPI.

---

## Frontend Technology Standard

- Framework: Astro + React.
- Language target: **JavaScript-first**.
- File baru yang boleh digunakan: `.js`, `.jsx`, `.astro`, `.css`, `.scss` sesuai struktur project.
- File baru yang dilarang dibuat: `.ts`, `.tsx`, kecuali user meminta eksplisit.
- Catatan existing: repository menggunakan `src/middleware.js` dan `jsconfig.json`; jangan memperluas TypeScript tanpa instruksi eksplisit.
- UI Library: Materialize sesuai template project.
- Referensi UI wajib: `https://demos.pixinvent.com/materialize-html-admin-template/documentation/`.
- API communication: `fetch` atau wrapper API client resmi project.
- Auth: mengikuti mekanisme backend FastAPI.

---

## Struktur Frontend Target (Best Practice Astro)

```text
astro/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── react/
│   │   └── astro/
│   ├── layouts/
│   ├── pages/
│   ├── utils/
│   ├── hooks/
│   ├── lib/
│   └── middleware.js
├── docs/
├── astro.config.mjs
├── frontend_agent.md
├── jsconfig.json
├── package.json
└── README.md
```

Aturan struktur target:

- Gunakan `astro/src/components/react/` untuk komponen React reusable.
- Gunakan `astro/src/components/astro/` untuk komponen UI berbasis `.astro`.
- Gunakan `astro/src/layouts/` untuk template/layout page.
- Gunakan `astro/src/pages/` untuk route Astro berbasis file.
- Gunakan `astro/src/lib/` untuk API client, config, adapter, dan integrasi library.
- Gunakan `astro/src/utils/` untuk helper murni dan constants lintas modul.
- Gunakan `astro/src/hooks/` untuk custom React hooks.
- Gunakan `astro/src/assets/` untuk asset yang diproses bundler (image, font, style global).
- Gunakan `astro/public/` untuk static file yang di-serve langsung.
- Simpan dokumentasi frontend di `astro/docs/` jika khusus frontend, tetapi progress utama tetap di root `docs/`.
- Jangan buat folder paralel baru tanpa alasan arsitektur yang jelas dan terdokumentasi.

---

## Folder Governance dan Maintainability

Untuk mencegah struktur makin tidak teratur, gunakan aturan ini:

- `src/components/react`: komponen React reusable berbasis domain/fitur.
- `src/components/astro`: komponen presentasional/layout yang cocok untuk SSR Astro.
- `src/pages`: route Astro dan orchestration level halaman.
- `src/layouts`: layout utama dan wrapper halaman.
- `src/lib`: kode aplikasi internal (API client wrapper, auth, adapter, integration facade).
- `src/utils`: helper pure function, formatter, parser ringan, dan constants.
- `src/hooks`: custom hooks React yang reusable.
- `src/assets`: gambar, font, dan style global yang diproses pipeline Astro/Vite.
- `public/`: static asset final yang di-serve langsung.

Aturan tambahan:

- Dilarang menaruh business rule ke `src/assets` atau `public`; business rule frontend tetap di `src/lib`.
- Untuk library baru, prioritas utama adalah install via `package.json`; hindari copy manual vendor kecuali ada justifikasi teknis kuat.
- Pisahkan jelas domain UI (components/pages) dari logic infra (lib/utils/hooks).
- Jika perlu rapikan besar-besaran asset, lakukan bertahap per modul dan wajib update import path + uji build setiap batch kecil.
- Selama masa transisi dari struktur legacy, folder `src/js`, `src/libs`, `src/vendor`, `src/scss`, `src/fonts` boleh tetap ada, tetapi:
  - modul baru wajib masuk struktur target;
  - modul lama dipindah bertahap saat disentuh/refactor;
  - setiap batch migrasi wajib lolos verifikasi build.

---

## JavaScript Only Rules

- Jangan membuat file TypeScript baru.
- Jangan membuat type declaration manual kecuali sudah ada kebutuhan project yang jelas dan disetujui.
- Gunakan JSDoc jika butuh dokumentasi shape object.
- Pastikan import path sesuai alias project yang tersedia di `astro.config.mjs` dan/atau `jsconfig.json` existing.
- Jangan menambahkan dependency TypeScript tanpa instruksi eksplisit.
- Jika harus mengubah `astro/src/middleware.js`, jaga perubahan minimal dan pastikan tetap kompatibel dengan SSR flow Astro.

---

## Frontend Responsibility Rules

Frontend boleh melakukan:

- Render UI.
- Form handling.
- Validasi ringan untuk UX.
- Menampilkan loading, empty state, dan error state.
- Menyimpan state UI sementara.
- Mengonsumsi endpoint backend resmi.
- Menyesuaikan menu/tampilan berdasarkan permission dari backend.

Frontend dilarang:

- Query database langsung.
- Menyimpan business logic inti.
- Membuat JWT/token sendiri.
- Menentukan permission final.
- Mengirim data langsung ke CEISA/AP2/HUBNET.
- Menyimpan secret di source code.

---

## API Client Rules

- Gunakan wrapper API client terpusat untuk request berulang.
- Base URL harus dibaca dari environment/config frontend.
- Gunakan `credentials: 'include'` jika backend menggunakan cookie auth.
- Gunakan `Authorization: Bearer` hanya jika mekanisme auth project memang bearer token.
- Timeout request harus disediakan melalui wrapper jika memungkinkan.
- Handle status code umum: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.
- Jika `401`, arahkan user ke login atau jalankan flow refresh token jika tersedia.
- Jika `403`, tampilkan pesan akses ditolak.
- Jangan tampilkan stack trace mentah ke user.
- Setiap request API yang gagal wajib mencetak log error detail dari server ke browser console (`console.error`) agar debugging cepat (status code, endpoint, payload/message dari backend).

Contoh struktur wrapper:

```text
astro/src/lib/api/
├── http.js
├── authApi.js
├── userApi.js
└── warehouseApi.js
```

---

## Auth Guard Rules

- Protected route wajib menggunakan guard/middleware sesuai pola Astro project.
- Halaman login tidak boleh redirect loop.
- Halaman publik harus dikecualikan dari guard.
- Token/cookie validation harus melalui endpoint backend seperti `/auth/verify` jika tersedia.
- Permission frontend hanya untuk UX; backend tetap memvalidasi permission final.
- Unauthorized dan forbidden harus ditangani konsisten.

---

## SSR Rules

- Jangan akses `window`, `document`, `localStorage`, atau browser-only API pada server render tanpa guard.
- Gunakan client-side script atau React island jika butuh browser API.
- Import plugin browser-only harus dilakukan secara aman.
- Pastikan asset path bekerja pada dev, preview, dan production build.
- Hindari dependency yang tidak kompatibel dengan SSR kecuali dibungkus client-only.

---

## UI and Component Rules

- Pembuatan component dan page wajib merujuk ke dokumentasi UI template project.
- Untuk Materialize, baca referensi UI pada dokumentasi resmi: `https://demos.pixinvent.com/materialize-html-admin-template/documentation/`.
- Untuk modul EDI (`astro/src/pages/edi`) yang menghasilkan atau mengubah payload Cargo-IMP, validasi sintaks pesan wajib dilakukan di `https://www.parse2.com/service-cargoimp.shtml` sebelum dianggap selesai.
- Buat generic/reusable component jika pola akan dipakai ulang.
- Pisahkan component display, form, table, filter, pagination, modal, dan notification.
- Hindari duplikasi markup besar.
- Gunakan nama component yang jelas dan sesuai domain.
- Error, loading, empty state, dan success notification harus konsisten.

---

## Form Rules

- Validasi frontend hanya untuk UX dan feedback cepat.
- Validasi final tetap di backend.
- Tampilkan error field dari response `422` dengan jelas.
- Disable tombol submit ketika request berjalan.
- Cegah double submit.
- Gunakan confirmation dialog untuk aksi destructive seperti void, delete, cancel, resend, atau reset.

---

## Table and DataTables Rules

Untuk tabel besar:

- Gunakan server-side pagination.
- Gunakan backend untuk search, sort, dan filter.
- Jangan load semua data lalu filter di browser.
- Simpan state filter secara rapi jika user perlu kembali ke halaman yang sama.
- Validasi column mapping agar sesuai response backend.
- Tampilkan loading state dan empty state.

---

## Web Performance Optimization (WPO) Rules

WPO adalah kewajiban pada semua task frontend, termasuk refactor:

- Wajib gunakan code-splitting untuk modul berat (dynamic import, route-level split, atau `manualChunks`).
- Hindari bundle awal memuat dependency yang hanya dipakai di fitur tertentu.
- Prioritaskan lazy loading untuk komponen/chart/table berat yang tidak dibutuhkan saat first paint.
- Hindari duplikasi library antar `src/libs`, `src/vendor`, dan package manager dependencies.
- Hapus file/asset/script yang tidak dipakai untuk menurunkan beban build dan ukuran deploy.
- Setiap perubahan besar frontend wajib menyertakan verifikasi ukuran chunk build (sebelum vs sesudah) dan catatan dampaknya.
- Jika masih ada chunk besar, jelaskan penyebabnya dan rencana mitigasi bertahap di laporan progress.

---

## Frontend Module Creation Flow

Setiap membuat module frontend baru:

1. Analisis endpoint backend yang sudah tersedia.
2. Jika endpoint belum tersedia, minta/tambahkan endpoint backend sesuai `../materialize-fastapi/backend_agent.md`.
3. Buat API client method.
4. Buat page atau route.
5. Buat component form/table/filter yang reusable.
6. Tambahkan auth guard dan permission UI jika diperlukan.
7. Tambahkan loading, error, empty state, dan success notification.
8. Verifikasi flow create/read/update/delete jika ada.
9. Update dokumentasi progress harian di root `docs/progress-YYYY-MM-DD.md`.

Template flow:

```text
User Action di Web UI
   ↓
Component / Page Handler
   ↓
API Client
   ↓
FastAPI Backend
   ↓
Response
   ↓
Update UI State
```

---

## Testing and Verification Rules

- Jalankan lint/build sesuai script project jika tersedia.
- Untuk perubahan Cargo-IMP pada modul EDI, lampirkan hasil validasi parse2 (`message type`, ringkasan hasil valid/error, dan titik error jika ada).
- Pastikan route protected tidak bisa diakses tanpa auth.
- Pastikan `401/403` tertangani.
- Pastikan form menampilkan error validasi backend.
- Pastikan tabel besar memakai server-side pagination.
- Pastikan tidak ada error SSR seperti `window is not defined`.
- Pastikan WPO baseline terjaga:
  - cek warning ukuran chunk pada hasil build;
  - catat modul/dependency terbesar;
  - pastikan tidak ada asset tak terpakai yang ikut ter-bundle.
- Update progress report di root `docs/progress-YYYY-MM-DD.md`.

---

## Environment Rules

- Jangan commit `.env` production.
- Buat `.env.example` untuk konfigurasi yang dibutuhkan.
- Jangan simpan secret di frontend.
- Public env hanya boleh berisi nilai yang aman dilihat browser.
