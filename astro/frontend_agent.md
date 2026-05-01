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
- Catatan existing: repository masih memiliki `src/middleware.ts` dan `tsconfig.json`. Perlakukan sebagai legacy/existing; jangan memperluas TypeScript tanpa instruksi eksplisit.
- UI Library: Materialize sesuai template project.
- API communication: `fetch` atau wrapper API client resmi project.
- Auth: mengikuti mekanisme backend FastAPI.

---

## Struktur Frontend Aktual

```text
astro/
├── .astro/
├── .vscode/
├── dist/
├── docs/
├── node_modules/
├── public/
├── src/
│   ├── components/
│   ├── fonts/
│   ├── js/
│   ├── layouts/
│   ├── lib/
│   ├── libs/
│   ├── pages/
│   ├── scss/
│   ├── vendor/
│   └── middleware.ts
├── .env
├── .env.development
├── .env.production
├── .gitignore
├── astro.config.mjs
├── frontend_agent.md
├── minify-public-js.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

Aturan struktur aktual:

- Gunakan `astro/src/components/` untuk komponen reusable.
- Gunakan `astro/src/layouts/` untuk layout.
- Gunakan `astro/src/pages/` untuk route/page Astro.
- Gunakan `astro/src/lib/` dan/atau `astro/src/libs/` sesuai pola existing project; jangan membuat folder paralel baru tanpa alasan jelas.
- Gunakan `astro/src/js/`, `astro/src/scss/`, dan `astro/src/vendor/` sesuai pola template Materialize existing.
- Simpan dokumentasi frontend di `astro/docs/` jika khusus frontend, tetapi progress utama tetap di root `docs/`.

---

## JavaScript Only Rules

- Jangan membuat file TypeScript baru.
- Jangan membuat type declaration manual kecuali sudah ada kebutuhan project yang jelas dan disetujui.
- Gunakan JSDoc jika butuh dokumentasi shape object.
- Pastikan import path sesuai alias project yang tersedia di `astro.config.mjs` dan/atau `tsconfig.json` existing.
- Jangan menambahkan dependency TypeScript tanpa instruksi eksplisit.
- Jika harus mengubah `astro/src/middleware.ts`, jaga perubahan minimal dan pertimbangkan migrasi bertahap ke JavaScript bila kompatibel dengan konfigurasi Astro project.

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
- Untuk Materialize, baca referensi UI pada dokumentasi template yang dipakai project sebelum membuat komponen baru.
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
- Pastikan route protected tidak bisa diakses tanpa auth.
- Pastikan `401/403` tertangani.
- Pastikan form menampilkan error validasi backend.
- Pastikan tabel besar memakai server-side pagination.
- Pastikan tidak ada error SSR seperti `window is not defined`.
- Update progress report di root `docs/progress-YYYY-MM-DD.md`.

---

## Environment Rules

- Jangan commit `.env` production.
- Buat `.env.example` untuk konfigurasi yang dibutuhkan.
- Jangan simpan secret di frontend.
- Public env hanya boleh berisi nilai yang aman dilihat browser.
