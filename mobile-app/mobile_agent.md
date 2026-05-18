# AGENTS.md

## Identitas Project

Project ini adalah aplikasi mobile **React Native + Expo** yang menggunakan **JavaScript saja**.

Project harus tetap fokus sebagai frontend mobile. Jangan membuat kode backend, migrasi database, route server, API controller, atau script deployment server di dalam repository ini.

## Aturan Wajib

1. Gunakan JavaScript saja.
   - Diizinkan: `.js`, `.jsx`, `.json`, `.md`.
   - Tidak diizinkan: `.ts`, `.tsx`.
   - Jangan menambahkan file konfigurasi TypeScript.

2. Jaga kode agar mudah dirawat.
   - Screen berada di `src/screens`.
   - Komponen UI reusable/primitif berada di `src/components/ui`.
   - Kerangka layout screen berada di `src/components/layout`.
   - Komponen reusable khusus fitur boleh berada di `src/components` hanya jika bukan UI primitif generik.
   - API call berada di `src/services`.
   - Global state berada di `src/contexts`.
   - File route Expo Router berada di `app/`.
   - Jangan membuat ulang `src/navigation`; aplikasi sekarang menggunakan Expo Router sebagai layer navigasi aktif.
   - Warna, spacing, dan typography bersama berada di `src/styles`.
   - Fungsi validasi/helper berada di `src/utils`.

3. Beri komentar pada setiap function dan component penting.
   - Setiap exported function wajib memiliki komentar JSDoc.
   - Setiap screen component wajib menjelaskan perannya.
   - Setiap service function wajib menjelaskan input dan output.
   - Jangan menambahkan komentar berlebihan untuk variabel satu baris yang sudah jelas.

4. Jangan memanggil API langsung dari screen.
   - Screen boleh memanggil method dari context atau service.
   - Screen tidak boleh berisi logic `fetch()` yang berulang.
   - Konfigurasi API URL harus berada di `.env` dan `src/config/env.js`.

5. Jangan hardcode nilai sensitif.
   - Jangan hardcode token.
   - Jangan hardcode production API URL di dalam screen.
   - Jangan commit `.env`.

6. Jaga authentication agar predictable.
   - Auth state dikelola di `src/contexts/AuthContext.js`.
   - Penyimpanan token ditangani oleh `src/services/storageService.js`.
   - Perilaku request login ditangani oleh `src/services/authService.js`.

7. Mulai dari solusi sederhana.
   - Jangan menambahkan Redux, Zustand, SQLite, Firebase, atau library push notification kecuali memang dibutuhkan secara eksplisit.
   - Untuk aplikasi CRUD standar, prioritaskan Context + service functions terlebih dahulu.

8. Gunakan library yang kompatibel dengan Expo.
   - Prioritaskan `npx expo install <package>` saat menginstal package React Native native.
   - Jangan menambahkan package native yang membutuhkan konfigurasi native manual kecuali aplikasi sudah berpindah ke development build.

9. Gunakan NativeWind sebagai sistem styling utama UI mobile.
   - Sebelum mengubah file di dalam `mobile-app/`, baca `mobile-app/nativewind_agent.md`.
   - Prioritaskan utility style melalui `className` dibanding membuat block `StyleSheet.create` baru untuk screen dan UI reusable.
   - Pertahankan file setup NativeWind di root app: `global.css`, `metro.config.js`, dan konfigurasi PostCSS.
   - Pertahankan wiring NativeWind melalui `metro.config.js` dengan `withNativeWind(config, { input: './global.css' })`; package NativeWind yang terpasang saat ini tidak boleh memakai `nativewind/babel` atau `jsxImportSource: 'nativewind'` karena tidak mengekspor `nativewind/jsx-runtime`.
   - Untuk third-party component yang tidak mendukung `className` dengan stabil, gunakan object `style` lokal kecil daripada memaksa API interop yang tidak didukung.
   - Pertahankan aturan JavaScript-first: jangan menambahkan `nativewind-env.d.ts` atau file TypeScript lain.

10. Gunakan pola shared screen layout.

- Kerangka dasar screen berada di `src/components/layout/`.
- Screen baru sebaiknya mulai dari `ScreenLayout` untuk safe area, perilaku keyboard, perilaku scroll, dan max-width web.
- Stack/detail screen sebaiknya memakai `ScreenHeader` kecuali membutuhkan top bar custom yang jelas.
- Screen harus fokus pada konten dan behavior, bukan mengulang boilerplate safe area, scroll, keyboard, dan footer.
- Jika screen terlihat blank, cek terlebih dahulu `app/_layout.js`, file route Expo Router, `AuthContext`, `ScreenLayout`, dan setup NativeWind sebelum mengubah business logic.

11. Gunakan shared UI kit.

- Prioritaskan import dari `src/components/ui/index.js`.
- Primitive yang tersedia meliputi `Text`, `Button`, `Input`, `Card`, `Badge`, `Separator`, `Spinner`, `Drawer`, `BarcodeScanner`, dan `QrScanner`.
- UI primitive baru wajib berupa file JavaScript di `src/components/ui/`, memiliki JSDoc, dan memakai styling NativeWind `className`.
- Export primitive baru dari `src/components/ui/index.js`.
- Jangan menyalin file TypeScript, typed routes, `tsconfig.json`, atau `nativewind-env.d.ts` dari source template.
- Jangan menginstal dependency UI yang ditunda seperti bottom sheet, gesture drawer, checkbox, switch, select, dialog, atau permission module kecuali ada flow screen konkret yang membutuhkannya.

## Gaya Coding

- Gunakan functional React components.
- Gunakan nama component yang jelas, misalnya `LoginScreen`, `DashboardScreen`, `Button`, dan `BarcodeScanner`.
- Jaga setiap file agar fokus pada satu tanggung jawab.
- Hindari screen yang terlalu besar. Ekstrak UI berulang ke `src/components/ui` atau `src/components/layout` sesuai tanggung jawabnya.
- Jaga konsistensi layout level screen melalui `ScreenLayout`, lalu ekstrak header/action berulang ke `src/components/layout`.
- Simpan validasi form di file utility jika memungkinkan.
- Gunakan `async/await` untuk logic asynchronous.
- Tangani error API dengan pesan yang mudah dibaca.

## Scope Starter Saat Ini

Starter saat ini mencakup:

- Login screen
- Dashboard screen
- Authentication context
- Mode mock login
- Persistent token storage
- API request wrapper
- Konfigurasi API berbasis environment
- EAS build profile untuk Android APK preview dan Android App Bundle production
- Expo Router dengan file route JavaScript di `app/`

## Akun Demo

```txt
Email: admin@admin.com
Password: password123
```

Mock login dikontrol oleh:

```txt
EXPO_PUBLIC_USE_MOCK_AUTH=true
```

Ubah menjadi `false` ketika API asli sudah siap.

## Penting

- Progress report di `docs/report-progress/progress-YYYY-MM-DD.md` wajib diperbarui setelah perubahan.
