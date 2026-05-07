**Audit Ringkas (Frontend `astro/`)**

Scope yang saya cek: struktur folder, arsitektur import, API client/auth guard, dan baseline build.

1. Baseline build saat ini **sukses** (`npm run build`) dengan warning chunk besar.
2. Struktur aktual masih **legacy-heavy**:

- Ada `src/js`, `src/libs`, `src/vendor`, `src/scss`, `src/fonts`.
- Belum ada `src/assets`, `src/hooks`, `src/utils`, `src/components/react`, `src/components/astro`.

3. Ketergantungan ke alias legacy masih tinggi:

- `@js/`: 22 referensi
- `@libs/`: 14 referensi
- `@vendor/`: 4 referensi
- `@scss/`: 2 referensi

4. Komponen masih campur:

- Domain components ada di `src/components/*`
- Shared components ada langsung di root `src/components` (contoh `Nav.jsx`, `VendorLoader.jsx`).

5. API/auth:

- API wrapper sudah bagus dan terpusat di [client.js](c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/lib/api/client.js), tapi masih bergantung ke `@js/auth.js` (belum masuk domain `lib`/`utils`).

6. Dokumentasi frontend drift:

- [README.md](c:/Users/wisnu/Documents/Belajar/materialize-project/astro/README.md) masih campuran template + struktur lama.
- Folder `astro/docs` saat ini tidak ada.

7. Performa bundling:

- Chunk `angkasapura` ~620KB (warning Vite >500KB), perlu code-splitting/manualChunks.

**Gap Analysis (Now vs Target Astro Best Practice)**

1. **Folder target belum terbentuk**  
   Now: struktur legacy dominan.  
   Target: `assets`, `hooks`, `utils`, split `components/react` & `components/astro`.

2. **Boundary logic belum tegas**  
   Now: helper/auth/UI script tersebar di `src/js`.  
   Target: logic app di `src/lib` + `src/utils`, hooks di `src/hooks`.

3. **Import alias belum siap migrasi penuh**  
   Now: alias lama aktif (`@js`, `@libs`, `@vendor`, `@scss`).  
   Target: alias baru bertahap tanpa memutus route aktif.

4. **Governance quality gate minim**  
   Now: belum ada `lint` script standar.  
   Target: minimal gate per batch (`build` + smoke test route utama).

5. **Dokumentasi tidak sinkron**  
   Now: README + docs frontend belum mencerminkan target arsitektur terbaru.  
   Target: dokumen refactor roadmap + migration log per batch.

---

**Checklist Langkah Refactor Frontend**

1. **Freeze Baseline**

- [ ] Lock baseline branch kerja.
- [ ] Simpan hasil baseline build + daftar route kritikal smoke test.

2. **Define Target Map**

- [ ] Buat struktur target: `src/assets`, `src/components/react`, `src/components/astro`, `src/hooks`, `src/utils`.
- [ ] Tetapkan mapping migrasi per folder legacy (`js/libs/vendor/scss/fonts`).

3. **Alias & Import Safety Net**

- [ ] Tambah alias baru di `astro.config.mjs` + `jsconfig.json`.
- [ ] Pertahankan alias lama sementara (compatibility window).

4. **Refactor Shared Layer Dulu (Low Risk)**

- [ ] Pindahkan helper murni dari `src/js` ke `src/utils`.
- [ ] Pindahkan auth helper reusable ke `src/lib/auth` (tanpa ubah behavior).
- [ ] Pastikan [client.js](c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/lib/api/client.js) tidak lagi tergantung util legacy.

5. **Refactor Components Layer**

- [ ] Split `src/components` ke `components/react` dan `components/astro`.
- [ ] Rapikan shared components (`Nav`, `Menu`, `VendorLoader`, `ToasterProvider`) ke grup yang konsisten.
- [ ] Pertahankan barrel export agar perubahan import minim.

6. **Refactor Feature Modules Bertahap**

- [ ] Batch 1: `auth`, `setting`, `warehouse` (risiko lebih rendah).
- [ ] Batch 2: `hubnet`, `angkasapura`.
- [ ] Batch 3: `edi` (plus validasi parse2 untuk perubahan Cargo-IMP).

7. **Assets & Styling Consolidation**

- [ ] Migrasi asset yang diproses bundler ke `src/assets`.
- [ ] Audit duplikasi `libs` vs `vendor`; tetapkan single source.
- [ ] Pertahankan output static di `public/assets` yang memang harus public.

8. **Performance Pass**

- [ ] Terapkan dynamic import untuk modul berat.
- [ ] Pertimbangkan `manualChunks` untuk vendor besar.
- [ ] Bandingkan ukuran chunk sebelum/sesudah.

9. **Verification Gate per Batch**

- [ ] `npm run build` wajib hijau setiap batch.
- [ ] Smoke test route utama: `auth`, `edi`, `hub-net`, `angkasapura`, `warehouse`.
- [ ] Verifikasi error API tetap muncul di `console.error` saat gagal.

10. **Documentation & Delivery**

- [ ] Update README frontend agar sesuai struktur baru.
- [ ] Simpan log progress harian di [docs/progress-2026-05-07.md](c:/Users/wisnu/Documents/Belajar/materialize-project/docs/progress-2026-05-07.md).
- [ ] Tambah dokumen migration map frontend.

Catatan penting sebelum eksekusi refactor: workspace saat ini sudah dalam kondisi dirty dan ada beberapa file terhapus yang bukan aksi saya di langkah audit ini. Konfirmasi dulu apakah saya lanjut refactor di atas kondisi ini, atau Anda ingin saya tunggu sampai status workspace Anda distabilkan dulu.
