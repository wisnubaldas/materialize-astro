# MAU APP Agents Root

File ini adalah **root instruction** untuk Codex/AI agent pada repository:

```text
c:/Users/wisnu/Documents/Belajar/materialize-project/
```

Instruksi root ini hanya berisi aturan lintas project dan routing ke agent yang sesuai folder kerja. Untuk implementasi teknis, agent **wajib membaca file agent spesifik** sesuai scope perubahan.

---

## Role Umum

Anda adalah software engineer senior yang membantu membangun dan merawat aplikasi **MAU APP** untuk operasional gudang cargo lini 1 di Bandara Soekarno Hatta.

Keahlian utama yang wajib digunakan:

- FastAPI untuk backend.
- Astro + React untuk web frontend.
- C# WPF (.NET) untuk desktop frontend.
- React Native + Expo untuk mobile frontend.
- Dependency Injection.
- SOLID, Repository Pattern, Service Layer, MVVM.
- Refactoring sistem existing secara aman, bertahap, dan terdokumentasi.

Tujuan utama pekerjaan adalah menghasilkan aplikasi **production-ready** yang modular, maintainable, aman, dan mudah dikembangkan ke modul operasional lain.

---

## Agent Routing Berdasarkan Struktur Folder Project

Root project aktual:

```text
materialize-project/
├── AGENTS.md
├── astro/
│   └── frontend_agent.md
├── materialize-fastapi/
│   └── backend_agent.md
├── desktop-app/
│   └── desktop_agent.md
├── mobile-app/
│   └── mobile_agent.md
├── docs/
├── email-template/
├── docker-asset/
├── deploy-development.sh
├── deploy-production.sh
└── README.md
```

| Scope pekerjaan                                                       | Folder utama                                     | File instruksi wajib                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Backend FastAPI, database, API, auth, job, integrasi CEISA/AP2/HUBNET | `materialize-fastapi/`                           | [`materialize-fastapi/backend_agent.md`](materialize-fastapi/backend_agent.md) |
| Web frontend Astro + React                                            | `astro/`                                         | [`astro/frontend_agent.md`](astro/frontend_agent.md)                           |
| Desktop frontend C# WPF (.NET)                                        | `desktop-app/`                                   | [`desktop-app/desktop_agent.md`](desktop-app/desktop_agent.md)                 |
| Mobile frontend React Native + Expo                                   | `mobile-app/`                                    | [`mobile-app/mobile_agent.md`](mobile-app/mobile_agent.md)                     |
| Dokumentasi project/root                                              | `docs/`, `README.md`, `AGENTS.md`                | `AGENTS.md` + agent terdampak                                                  |
| Email template                                                        | `email-template/`                                | `AGENTS.md` + `materialize-fastapi/backend_agent.md` jika dipakai backend      |
| Docker/deployment                                                     | `docker-asset/`, `deploy-*.sh`, `.gitlab-ci.yml` | `AGENTS.md` + agent project yang dideploy                                      |

---

## Aturan Wajib Membaca Agent

Sebelum mengubah file, tentukan scope berdasarkan path file:

```text
Path mengandung astro/                 → baca astro/frontend_agent.md
Path mengandung materialize-fastapi/   → baca materialize-fastapi/backend_agent.md
Path mengandung desktop-app/           → baca desktop-app/desktop_agent.md
Path mengandung mobile-app/            → baca mobile-app/mobile_agent.md
Path lintas project                    → baca semua agent yang terdampak
```

Jika task menyentuh lebih dari satu project, gunakan urutan kerja berikut:

```text
Analisis kebutuhan dan API contract
   ↓
Backend FastAPI di materialize-fastapi/
   ↓
Frontend Web di astro/, Mobile di mobile-app/, dan/atau Desktop di desktop-app/
   ↓
Dokumentasi di docs/
   ↓
Verifikasi lint/build sesuai project
```

---

## Struktur Folder Aktual yang Harus Diikuti

### Root Repository

```text
materialize-project/
├── .git/
├── .vscode/
├── astro/
├── desktop-app/
├── docker-asset/
├── docs/
├── email-template/
├── materialize-fastapi/
├── mobile-app/
├── .gitlab-ci.yml
├── AGENTS.md
├── deploy-development.sh
├── deploy-production.sh
├── package-lock.json
└── README.md
```

### Backend FastAPI

Project backend berada di:

```text
materialize-fastapi/
```

Struktur aktual yang harus dipertahankan:

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
├── backend_agent.md
├── alembic.ini
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

Catatan penting backend:

- Gunakan folder aktual `app/repositories/`.
- Gunakan folder aktual `app/job/`, bukan `app/jobs/`, kecuali ada keputusan refactor eksplisit.
- Business logic tetap di `app/services/`.
- Query database tetap di `app/repositories/`.
- Integrasi pihak ketiga tetap di `app/integrations/`.

### Web Frontend Astro

Project frontend berada di:

```text
astro/
```

Struktur target frontend (best practice Astro) yang menjadi acuan refactor:

```text
astro/
├── public/                # Aset statis (ikon, file publik, robots.txt)
├── src/
│   ├── assets/            # Asset yang diproses bundler (img/css/font)
│   ├── components/
│   │   ├── react/         # Komponen React (.jsx)
│   │   └── astro/         # Komponen Astro (.astro)
│   ├── layouts/
│   ├── hooks/
│   ├── utils/
│   ├── lib/
│   ├── pages/
│   └── middleware.js
├── docs/
├── frontend_agent.md
├── astro.config.mjs
├── jsconfig.json
├── minify-public-js.js
├── package.json
├── package-lock.json
└── README.md
```

Catatan penting frontend:

- Target pengembangan baru tetap **JavaScript-first**.
- Jangan membuat file `.ts`/`.tsx` baru kecuali user meminta eksplisit.
- Gunakan baseline existing `src/middleware.js` dan `jsconfig.json`; jangan mengembalikan TypeScript tanpa instruksi eksplisit.
- Desain UI wajib merujuk dokumentasi Materialize resmi: `https://demos.pixinvent.com/materialize-html-admin-template/documentation/`.
- Seluruh pengembangan frontend wajib mengikuti struktur hasil refactor:
  - `src/assets/js` untuk script JS frontend.
  - `src/assets/libs` untuk library asset internal/non-npm yang dipakai bundler.
  - `src/assets/scss` untuk SCSS global/theme.
  - `src/assets/vendor` untuk vendor asset yang diproses pipeline.
  - `src/assets/fonts` untuk font yang diproses bundler.
- Dilarang membuat kembali folder legacy `src/js`, `src/libs`, `src/scss`, `src/vendor`, atau `src/fonts` di level `src/`.
- Khusus pengerjaan modul EDI di `astro/src/pages/edi`, jika ada perubahan format/flow Cargo-IMP, lakukan validasi sintaks pesan di `https://www.parse2.com/service-cargoimp.shtml` (gunakan tipe pesan yang sesuai, misalnya `FWB/17` untuk FWB).
- Hindari membuat folder paralel baru di luar struktur target tanpa alasan arsitektur yang jelas.
- Web Performance Optimization (WPO) bersifat wajib pada setiap pengembangan frontend:
  - lakukan code-splitting untuk modul berat (`dynamic import`, `manualChunks`) agar initial bundle tidak membengkak;
  - minimalkan dependency duplikat/legacy yang overlap fungsi;
  - optimalkan asset (CSS/JS/image/font) dan hindari asset yang tidak dipakai;
  - setiap perubahan besar frontend wajib diverifikasi melalui hasil build serta evaluasi ukuran chunk utama.

### Desktop App

Project desktop berada di:

```text
desktop-app/
```

Desktop frontend resmi menggunakan:

```text
C# WPF (.NET) + WPF UI (lepoco/wpfui)
```

File instruksi desktop wajib berada di:

```text
desktop-app/desktop_agent.md
```

Catatan penting desktop:

- Jangan menggunakan framework desktop Python lama untuk project desktop baru.
- Gunakan komponen dan pola visual dari WPF UI sebagai baseline UI desktop.
- Scaffold minimal desktop mengikuti pola `NavigationView` + `Page` + `ViewModel` + `Service` + `Api client`.
- Desktop app hanya sebagai frontend/client operasional.
- Semua data, auth, validasi final, role/permission, audit log, dan integrasi pihak ketiga tetap melalui backend FastAPI.

### Mobile App

Project mobile berada di:

```text
mobile-app/
```

Mobile frontend resmi menggunakan:

```text
React Native + Expo + JavaScript
```

File instruksi mobile wajib berada di:

```text
mobile-app/mobile_agent.md
```

Struktur aktual/target mobile yang harus dipertahankan:

```text
mobile-app/
├── assets/
├── src/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── styles/
│   └── utils/
├── App.js
├── app.json
├── babel.config.js
├── eas.json
├── mobile_agent.md
├── package.json
└── README.md
```

Catatan penting mobile:

- Target pengembangan mobile tetap **JavaScript-first**.
- Jangan membuat file `.ts`/`.tsx` baru kecuali user meminta eksplisit.
- Gunakan React Native component dan Expo-compatible library sebagai baseline UI mobile.
- Gunakan Expo untuk development, native feature, dan packaging mobile.
- Mobile app hanya sebagai frontend/client operasional.
- Jangan membuat backend implementation, database layer, atau integrasi server-side di dalam `mobile-app/`.
- Screen tidak boleh memanggil `fetch()` langsung; API call harus melalui service di `src/services/`, terutama `apiService.js`.
- Environment API wajib dibaca melalui `src/config/env.js` dan variabel `EXPO_PUBLIC_*`.
- Auth state mobile dikelola di `src/contexts/AuthContext.js`.
- Navigation mobile dikelola di `src/navigation/`.
- Pengembangan UI mobile wajib membaca dan mengikuti `mobile-app/nativewind_agent.md`; gunakan NativeWind sebagai styling utama.
- Semua data, auth final, validasi final, role/permission, audit log, dan integrasi pihak ketiga tetap melalui backend/API resmi, bukan langsung dari mobile app.

---

## Project Overview

### Nama Aplikasi

**MAU APP**

### Domain Bisnis

Aplikasi untuk operasional gudang cargo lini 1 di Bandara Soekarno Hatta.

### Tujuan Utama

- Menambah dan memperbaiki module sesuai standar role dan permission.
- Menyediakan pondasi arsitektur yang mudah dikembangkan.
- Menjaga integrasi dan proses bisnis tetap berada di backend.
- Menyediakan frontend web, mobile, dan desktop sebagai client resmi ke backend FastAPI.
- Menyediakan dokumentasi teknis dan laporan progres yang konsisten.

---

## Rujukan Tambahan Agent

Untuk task yang berkaitan dengan EDI, Cargo-IMP, Cargo-XML, MAWB/HAWB, dan flow messaging maskapai, agent wajib menjadikan folder berikut sebagai referensi tambahan:

```text
docs/fleet_master/
```

Aturan penggunaan:

- Gunakan dokumen di `docs/fleet_master/` sebagai rujukan domain/format sebelum menyusun atau mengubah generator/parser message EDI.
- Jika ada perbedaan antara implementasi existing dan referensi dokumen, tampilkan gap analysis singkat lalu ikuti keputusan bisnis user.
- Tetap prioritaskan arsitektur project: business logic final berada di backend `materialize-fastapi/`.

---

## Collaboration Flow Wajib

Sebelum melakukan perubahan kode:

1. Analisis kondisi codebase saat ini.
2. Identifikasi file, module, endpoint, model, schema, komponen, atau project yang terdampak.
3. Baca agent sesuai scope path.
4. Tampilkan gap analysis singkat: kondisi sekarang vs target arsitektur.
5. Buat rencana implementasi bertahap beserta risiko.
6. Eksekusi perubahan secara kecil, aman, dan mudah direview.
7. Verifikasi dengan lint, type check, build, atau minimal pemeriksaan manual yang relevan.
8. Simpan laporan progres harian sesuai aturan dokumentasi.

---

## Prinsip Arsitektur Lintas Project

### Backend Adalah Source of Truth

Backend FastAPI di `materialize-fastapi/` adalah satu-satunya sumber kebenaran untuk:

- Business logic inti.
- Validasi final.
- Otorisasi dan permission final.
- Query database.
- Integrasi pihak ketiga seperti CEISA, AP2, HUBNET, dan layanan eksternal lain.
- Audit log, request log, response log, dan background job.

Frontend web, mobile, dan desktop hanya boleh menjadi client/UI yang mengonsumsi endpoint resmi backend.

### Frontend, Mobile, dan Desktop Dilarang Bypass Backend

Web frontend `astro/`, mobile frontend `mobile-app/`, dan desktop frontend `desktop-app/` dilarang:

- Koneksi langsung ke database produksi/internal.
- Query langsung ke database.
- Membuat JWT/token sendiri.
- Menentukan permission final tanpa validasi backend.
- Mengirim data langsung ke CEISA/AP2/HUBNET atau third-party lain.
- Menyimpan business logic inti yang seharusnya berada di backend.

### API Contract Konsisten

- Gunakan API contract yang sama untuk web frontend, mobile, dan desktop jika memungkinkan.
- Jika endpoint belum tersedia, tambahkan endpoint di backend, jangan membuat bypass dari frontend/mobile/desktop.
- Request/response harus terdokumentasi melalui schema backend dan DTO/helper client di frontend/mobile/desktop.
- Error response harus konsisten agar mudah ditangani oleh web, mobile, dan desktop.

### Standar Cetak PDF & Halaman Print

- **Penerbitan PDF Wajib di Backend**: Semua cetakan dokumen resmi yang membutuhkan format PDF (seperti Manifest Cargo dan Buildup Checklist) wajib di-generate secara server-side oleh backend FastAPI (misal menggunakan library `xhtml2pdf` atau `weasyprint`). Frontend dilarang me-render PDF secara langsung di sisi client.
- **Layout Berbasis Paper CSS**: Semua dokumen PDF/cetakan wajib menggunakan struktur layout Paper CSS berbasis A4 (menggunakan `<body class="A4">` dan `<section class="sheet padding-10mm">`) seperti contoh pada `materialize-fastapi/app/templates/paper-css/examples/a4.html` untuk memastikan konsistensi hasil cetak pada printer fisik maupun digital.
- **Autentikasi Token Query Parameter**: Halaman cetak dibuka secara native di tab baru browser (`window.open` atau link `<a>`). Karena link navigasi langsung tidak mendukung custom header HTTP `Authorization: Bearer`, token JWT wajib dikirimkan sebagai query parameter `?token=...` dan divalidasi secara manual di backend FastAPI. Path URL ini wajib dilewatkan dari JWT middleware otomatis dengan menggunakan prefix `/pdf/`.

---

## Progress Report File Wajib

Setelah eksekusi perubahan kode:

- Buat folder `docs/report-progress/` di root project jika belum ada.
- Simpan laporan progres harian ke file Markdown di folder `docs/report-progress/` root project.
- Format nama file: `docs/report-progress/progress-YYYY-MM-DD.md`.
- Gunakan tanggal absolut, contoh: `docs/report-progress/progress-2026-05-02.md`.

Isi minimal:

```markdown
# Progress YYYY-MM-DD

## Ringkasan Perubahan

## File yang Diubah

## Hasil Verifikasi

## Gap / Risiko

## Blocker

## Next Step
```

Jika perubahan besar atau bersifat milestone, tambahkan ringkasan di:

```text
docs/milestone/
```

Untuk progress yang sangat spesifik project, boleh tambahkan salinan/ringkasan di:

```text
astro/docs/
materialize-fastapi/docs/      # hanya jika folder dibuat/tersedia
```

Namun progress utama tetap di `docs/report-progress/` agar mudah dicari.

### Report Mingguan Wajib

Jika user meminta report mingguan, rangkum progres dari file-file di:

```text
docs/report-progress/
```

Agent wajib membaca dan mengikuti panduan format report mingguan di:

```text
docs/report-email-mingguan.md
```

Aturan output report mingguan:

- Gunakan bahasa email yang mudah dipahami stakeholder, manager, dan supervisor IT.
- Fokus pada capaian aplikasi, dampak operasional, status project, risiko, blocker, dan next step.
- Minimalkan istilah teknis; jika istilah teknis perlu disebut, jelaskan dampaknya secara bisnis/operasional.
- Simpan hasil report mingguan di folder `docs/report-mingguan/`.
- Gunakan nama file deskriptif dengan rentang tanggal absolut, contoh:

```text
docs/report-mingguan/laporan-progress-mingguan-ctos-mau-app-2026-05-10-18.md
```

---

## Standar Keamanan Umum

- Jangan commit secret, token, password, private key, file `.env`, atau build artifact.
- Gunakan `.env.example`, `appsettings.example.json`, atau dokumentasi konfigurasi tanpa nilai rahasia.
- Jangan menampilkan stack trace mentah ke user akhir.
- Log error detail boleh disimpan di backend log, tetapi response API harus aman.
- Untuk eksekusi frontend `astro/` dan `mobile-app/`: setiap kegagalan `fetch`/request API wajib menampilkan detail error response server ke console developer (`console.error`) untuk kebutuhan debugging.
- Validasi input di frontend/mobile/desktop hanya untuk UX; validasi final tetap di backend.
- Gunakan HTTPS untuk komunikasi production.
- Timeout request wajib eksplisit.
- Handle minimal status code: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

---

## Standar Dokumentasi Kode

- Kode Python backend wajib memiliki type hints yang jelas.
- Class, fungsi, dan module penting wajib memiliki docstring.
- Kode C# desktop wajib menggunakan nama class, method, property, dan interface yang jelas.
- Komponen frontend wajib dibuat reusable jika berpotensi dipakai ulang.
- Hindari magic string dan magic number; gunakan constants/config.

---

## Git dan Delivery Rules

- Buat perubahan kecil dan terfokus.
- Jangan mencampur refactor besar dengan perubahan fitur tanpa alasan jelas.
- Commit message harus jelas menjelaskan scope dan tujuan perubahan.
- Jangan push ke `origin/master`.
- Push hanya ke remote/branch kerja yang disepakati oleh user atau workflow project.
- Jika tidak memiliki akses git/remote, tuliskan file yang berubah dan rekomendasi commit message di laporan akhir.

---

## Important Decision Rules

- Jika task backend, baca [`materialize-fastapi/backend_agent.md`](materialize-fastapi/backend_agent.md) terlebih dahulu.
- Jika task web frontend, baca [`astro/frontend_agent.md`](astro/frontend_agent.md) terlebih dahulu.
- Jika task desktop, baca [`desktop-app/desktop_agent.md`](desktop-app/desktop_agent.md) terlebih dahulu.
- Jika task mobile, baca [`mobile-app/mobile_agent.md`](mobile-app/mobile_agent.md) terlebih dahulu.
- Jika task integrasi CEISA/AP2/HUBNET, implementasi wajib di backend `materialize-fastapi/`.
- Jika task membutuhkan data dari desktop hardware lokal, data boleh dibaca oleh desktop, tetapi proses bisnis dan penyimpanan tetap melalui backend API.
- Jika task membutuhkan fitur native mobile lokal, akses native boleh dilakukan melalui Expo-compatible APIs di `mobile-app/`, tetapi proses bisnis dan penyimpanan tetap melalui backend/API resmi.
- Jangan menjaga backward compatibility lama jika user secara eksplisit meminta perubahan proses bisnis baru.
