# Checklist Adopsi Expo NativeWind Template ke MAU APP Mobile

Dokumen ini adalah panduan bertahap untuk mengadopsi pola dari:

- GitHub: https://github.com/chvvkrishnakumar/expo-nativewind-template
- Referensi terkait: https://www.nativewind.dev/
- Referensi konsep komponen: https://reactnativereusables.com/docs

Target adopsi adalah **mengambil pola UI component library dan design system**, bukan mengganti konsep dasar MAU APP Mobile.

## Aturan Wajib

- Project tetap **React Native + Expo + JavaScript**.
- Dilarang membuat file `.ts`, `.tsx`, `tsconfig.json`, atau `nativewind-env.d.ts`.
- Expo Router boleh diadopsi karena project berjalan di Expo, tetapi migrasi routing wajib bertahap dan tidak boleh mengubah auth, service, atau business flow.
- Dilarang memindahkan auth, API, atau storage keluar dari struktur existing.
- Screen tidak boleh memanggil `fetch()` langsung.
- API tetap melalui `src/services/`.
- Auth tetap melalui `src/contexts/AuthContext.js`.
- Layout screen tetap memakai `src/components/layout/ScreenLayout.js`.
- NativeWind tetap dipakai melalui `metro.config.js` + `global.css`.
- Jangan memakai `nativewind/babel`, `jsxImportSource: 'nativewind'`, atau `cssInterop` pada versi NativeWind project saat ini karena pernah menyebabkan error `nativewind/jsx-runtime` dan `cssInterop is not a function`.
- Untuk komponen pihak ketiga yang tidak stabil dengan `className`, gunakan `style` lokal kecil.

## Cara Menggunakan Checklist Ini

Setiap step wajib diperbarui setelah selesai.

Format update:

```md
- [x] Step selesai - 2026-05-14 - Catatan singkat hasil/verifikasi
```

Jika step gagal:

```md
- [ ] Step belum selesai - Blocker: jelaskan masalah dan rencana perbaikan
```

Jangan lanjut ke fase berikutnya jika checkpoint fase belum hijau.

## Struktur Folder Target

Struktur ini lebih ramping dari template sumber dan tetap mengikuti konsep MAU APP Mobile.

```text
mobile-app/
├── app/
│   ├── _layout.js
│   ├── index.js
│   ├── login.js
│   └── build-up-checklist.js
├── App.js                 # Compatibility entry selama migrasi, lalu bisa dipangkas bila Expo Router sudah stabil
├── app.json
├── babel.config.js
├── global.css
├── metro.config.js
├── package.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ScreenHeader.js
│   │   │   └── ScreenLayout.js
│   │   └── ui/
│   │       ├── badge.js
│   │       ├── button.js
│   │       ├── card.js
│   │       ├── input.js
│   │       ├── separator.js
│   │       ├── spinner.js
│   │       ├── text.js
│   │       ├── index.js
│   │       └── utils/
│   │           ├── cn.js
│   │           └── text-context.js
│   ├── config/
│   │   └── env.js
│   ├── constants/
│   │   └── ui.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── hooks/
│   │   ├── useColorScheme.js
│   │   └── usePlatform.js
│   ├── screens/
│   ├── services/
│   ├── styles/
│   │   └── theme.js
│   └── utils/
```

Catatan struktur:

- `src/components/ui/` menyimpan komponen UI reusable ala template sumber.
- `src/components/layout/` tetap khusus layout screen MAU APP.
- `src/constants/` hanya untuk token non-secret, misalnya varian ukuran dan semantic status.
- `src/hooks/` hanya untuk hook client-side ringan, bukan business logic.
- `app/` menyimpan route Expo Router yang tipis dan memanggil screen dari `src/screens/`.
- `src/navigation/` sudah dihapus setelah Expo Router stabil; jangan dibuat kembali kecuali ada keputusan arsitektur baru.
- `src/styles/theme.js` tetap boleh dipakai untuk token JavaScript yang tidak bisa nyaman ditulis di className.

## Fase 0 - Audit Awal

- [x] 0.1 Catat branch kerja saat ini dan pastikan tidak berada di `origin/master` - 2026-05-14 - Branch awal `master` tracking `origin/master`; dipindahkan ke branch lokal `mobile/adops-audit-2026-05-14` tanpa upstream.
- [x] 0.2 Jalankan `git status --short` dan pisahkan perubahan yang tidak terkait migrasi UI - 2026-05-14 - Worktree sudah berisi perubahan existing; perubahan terkait mobile UI dipisahkan dari catatan root/docs.
- [x] 0.3 Baca ulang `../AGENTS.md`, `mobile_agent.md`, dan `nativewind_agent.md` - 2026-05-14 - Instruksi JavaScript-only, service API, AuthContext, ScreenLayout, dan NativeWind sudah dikonfirmasi.
- [x] 0.4 Catat dependency existing dari `package.json` - 2026-05-14 - Dependency Expo 54, React 19, React Native 0.81, NativeWind 5 preview, React Navigation, dan runtime web sudah dicatat di progress report.
- [x] 0.5 Jalankan `npm run doctor` - 2026-05-14 - Berhasil, 17/17 checks passed.
- [x] 0.6 Jalankan `npx expo export --clear --platform web --output-dir .expo-web-check` - 2026-05-14 - Berhasil, web bundle `AppEntry` ter-export.
- [x] 0.7 Jalankan `npx expo export --clear --platform android --output-dir .expo-android-check` - 2026-05-14 - Berhasil, Android bundle `AppEntry` ter-export.
- [x] 0.8 Hapus folder `.expo-web-check` dan `.expo-android-check` setelah export selesai - 2026-05-14 - Kedua folder output audit sudah dihapus.
- [x] 0.9 Catat hasil audit di `docs/progress-YYYY-MM-DD.md` - 2026-05-14 - Hasil audit dicatat di `docs/progress-2026-05-14.md`.

Checkpoint fase 0:

- [x] Baseline export web berhasil.
- [x] Baseline export android berhasil.
- [x] Tidak ada build artifact tertinggal.
- [x] Catatan risiko awal sudah masuk progress report.

## Fase 1 - Mapping Template Sumber ke Project Ini

- [x] 1.1 Petakan komponen template sumber yang boleh diadopsi: `button`, `text`, `input`, `card`, `badge`, `separator`, `spinner` - 2026-05-14 - Diadopsi sebagai komponen JavaScript ringan di `src/components/ui/`; `separator` dibuat custom sederhana karena template sumber tidak punya file `separator` standalone.
- [x] 1.2 Tandai komponen yang ditunda: `dialog`, `sheet`, `drawer`, `checkbox`, `switch`, `select`, `permission-requester` - 2026-05-14 - Ditunda karena membawa dependency/native behavior tambahan dan belum ada kebutuhan bisnis langsung.
- [x] 1.3 Tandai bagian yang tidak boleh diadopsi langsung: `tsconfig.json`, file `.tsx`, typed routes TypeScript, dan struktur demo yang tidak relevan - 2026-05-14 - Template sumber TypeScript-first; MAU APP Mobile tetap JavaScript-only.
- [x] 1.3a Tandai bagian yang boleh diadopsi bertahap: `app/`, `_layout.js`, route file JavaScript, dan pola route tipis ke `src/screens` - 2026-05-14 - Expo Router boleh masuk bertahap setelah dependency minimal siap; route wajib wrapper tipis ke screen existing.
- [x] 1.4 Catat dependency template sumber yang relevan: `class-variance-authority`, `clsx`, `tailwind-merge` - 2026-05-14 - Relevan untuk variant component dan class merge, tanpa dependency native baru.
- [x] 1.5 Catat dependency template sumber yang ditunda: `lucide-react-native`, `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-svg`, permission Expo modules - 2026-05-14 - Ditunda agar Expo Go/dev workflow tidak bertambah kompleks sebelum kebutuhan UI jelas.
- [x] 1.6 Buat tabel mapping dari komponen lama ke komponen baru - 2026-05-14 - Mapping awal diperbarui berdasarkan komponen existing dan struktur target.

Hasil mapping fase 1:

| Area | Keputusan | Alasan |
| --- | --- | --- |
| UI primitive tahap pertama | `Text`, `Button`, `Input`, `Card`, `Badge`, `Separator`, `Spinner` | Komponen ini mengganti duplikasi inline tanpa mengubah auth, API, atau flow bisnis. |
| Utility class | `src/components/ui/utils/cn.js` dan `text-context.js` | Mengikuti pola template sumber, tetapi dikonversi ke JavaScript dan dibuat minimal. |
| Routing | Expo Router diadopsi bertahap melalui file `.js` | Route menjadi wrapper tipis, screen tetap di `src/screens`, auth tetap di `AuthContext.js`. |
| Theme token | Ditunda sampai komponen dasar stabil | Template sumber memakai token Tailwind/CSS variable yang perlu validasi khusus di NativeWind versi project. |
| Icon library baru | Ditunda | Project sudah memakai `@expo/vector-icons`; `lucide-react-native` perlu `react-native-svg` dan belum wajib. |
| Advanced UI | Ditunda | `dialog`, `sheet`, `drawer`, `select`, `checkbox`, `permission-requester` butuh evaluasi UX dan dependency native. |

Mapping awal:

| Existing | Target | Status |
| --- | --- | --- |
| `AppButton.js` | `src/components/ui/button.js` | Fase 5; wrapper sementara boleh dipakai agar refactor screen bertahap. |
| `AppInput.js` | `src/components/ui/input.js` | Fase 6; tetap pertahankan `placeholderTextColor` eksplisit. |
| `InfoCard.js` | `src/components/ui/card.js` | Fase 7; bisa jadi wrapper sementara ke `Card`, `CardContent`, dan `Text`. |
| Inline `Text` variant | `src/components/ui/text.js` | Fase 4; mulai dari variant sederhana sesuai MAU APP, bukan semua variant template. |
| Inline divider | `src/components/ui/separator.js` | Fase 8; implementasi custom `View` tipis karena tidak ada primitive standalone di template sumber. |
| Loading indicator | `src/components/ui/spinner.js` | Fase 8; wrapper kecil di atas `ActivityIndicator`. |
| Dashboard status pill/dot | `src/components/ui/badge.js` | Fase 8; dipakai untuk status kecil setelah `Text` stabil. |
| Login form container | `src/components/ui/card.js` | Fase 7/10; refactor bila tidak mengganggu keyboard layout. |
| Build Up form section | `src/components/ui/card.js` + `input.js` | Fase 7/10; pastikan validasi final tetap backend/API. |

Checkpoint fase 1:

- [x] Daftar komponen tahap pertama sudah disetujui.
- [x] Daftar komponen yang ditunda sudah jelas alasannya.
- [x] Tidak ada keputusan mengganti JavaScript ke TypeScript.
- [x] Keputusan memakai Expo Router sudah dicatat, dengan syarat route tetap JavaScript dan screen tetap di `src/screens`.

## Fase 2 - Dependency Minimal

- [x] 2.1 Install dependency UI minimal dengan `npm install class-variance-authority clsx tailwind-merge` - 2026-05-14 - Berhasil; dependency masuk ke `package.json` dan `package-lock.json`.
- [x] 2.2 Install Expo Router dengan `npx expo install expo-router expo-linking expo-constants expo-splash-screen` - 2026-05-14 - Berhasil; Expo menambahkan plugin `expo-router` ke `app.json`.
- [x] 2.3 Sesuaikan `package.json` `main` menjadi `expo-router/entry` hanya pada fase migrasi router - 2026-05-14 - Belum diubah pada Fase 2 karena folder `app/` belum dibuat; perubahan `main` dijadwalkan pada Fase 2A saat route JavaScript sudah tersedia.
- [x] 2.4 Jangan install dependency besar untuk `sheet`, `dialog`, permission, atau icon baru pada fase ini - 2026-05-14 - Tidak ada install `lucide-react-native`, `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-svg`, atau permission Expo modules.
- [x] 2.5 Jalankan `npm run doctor` - 2026-05-14 - Sempat gagal karena range React Navigation tidak sesuai rekomendasi Expo SDK; setelah range package disesuaikan, berhasil 17/17 checks passed.
- [x] 2.6 Jalankan export web dan android dengan `--clear` - 2026-05-14 - Export web dan Android berhasil memakai entry lama `node_modules/expo/AppEntry.js`.
- [x] 2.7 Update checklist step 2.1-2.6 dengan hasil verifikasi - 2026-05-14 - Checklist Fase 2 diperbarui.
- [x] 2.8 Update `docs/progress-YYYY-MM-DD.md` - 2026-05-14 - Progress report root diperbarui.

Checkpoint fase 2:

- [x] `package.json` hanya bertambah dependency minimal.
- [x] `package-lock.json` berubah sesuai dependency.
- [x] `expo-router` dependency tersedia dan `main` sudah sesuai saat fase router dimulai.
- [x] Export web berhasil.
- [x] Export android berhasil.

## Fase 2A - Migrasi Routing ke Expo Router

- [x] 2A.1 Buat folder `app/` - 2026-05-14 - Folder `app/` dibuat untuk route Expo Router.
- [x] 2A.2 Buat `app/_layout.js` sebagai root layout Expo Router - 2026-05-14 - Root layout berisi `Stack` dengan `headerShown: false`.
- [x] 2A.3 Pindahkan provider root dari `App.js` ke `app/_layout.js`: `SafeAreaProvider`, `AuthProvider`, dan `StatusBar` - 2026-05-14 - Provider root aktif di Expo Router layout; `App.js` tetap sebagai file compatibility lama.
- [x] 2A.4 Buat route `app/index.js` untuk dashboard/auth gate - 2026-05-14 - Route index menunggu auth boot, redirect ke `/login` jika belum login, dan render `DashboardScreen` jika sudah login.
- [x] 2A.5 Buat route `app/login.js` yang render `LoginScreen` - 2026-05-14 - Route login redirect ke `/` jika user sudah authenticated.
- [x] 2A.6 Buat route `app/build-up-checklist.js` yang render `BuildUpChecklistScreen` - 2026-05-14 - Route dilindungi auth gate dan redirect ke `/login` jika belum authenticated.
- [x] 2A.7 Ubah navigasi dari `navigation.navigate('BuildUpChecklist')` ke `router.push('/build-up-checklist')` - 2026-05-14 - `app/index.js` mengirim callback berbasis `router.push`; fallback legacy di screen tetap ada untuk `AppNavigator`.
- [x] 2A.8 Ubah `navigation.goBack()` ke `router.back()` atau `router.replace('/')` sesuai flow - 2026-05-14 - Route Build Up memakai `router.back()` jika ada history dan `router.replace('/')` sebagai fallback.
- [x] 2A.9 Pastikan route file hanya wrapper tipis; UI tetap di `src/screens` - 2026-05-14 - Route hanya auth gate/callback; UI utama tetap di `LoginScreen`, `DashboardScreen`, dan `BuildUpChecklistScreen`.
- [x] 2A.10 Jangan membuat file `_layout.tsx`, `index.tsx`, atau typed routes - 2026-05-14 - Semua route dibuat `.js`; pencarian `tsx`, `tsconfig`, dan `nativewind-env` di `app/` bersih.
- [x] 2A.11 Pertahankan `src/navigation/AppNavigator.js` sementara sampai route Expo Router selesai diverifikasi - 2026-05-14 - `AppNavigator` masih dipertahankan sebagai compatibility layer selama menunggu manual QA.
- [x] 2A.12 Setelah Expo Router stabil, hapus `src/navigation/AppNavigator.js` dan import terkait jika sudah tidak dipakai - 2026-05-14 - Belum dihapus pada fase ini karena stabilitas baru diverifikasi lewat doctor/export; cleanup final dijadwalkan setelah review manual.
- [x] 2A.13 Jalankan `npm run doctor` - 2026-05-14 - Berhasil, 17/17 checks passed.
- [x] 2A.14 Jalankan export web dan android dengan `--clear` - 2026-05-14 - Export web dan Android berhasil melalui `node_modules/expo-router/entry.js`.
- [x] 2A.15 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 2A:

- [x] App berjalan melalui `expo-router/entry`.
- [x] Login route tampil.
- [x] Dashboard route tampil.
- [x] Build Up route tampil.
- [x] Auth flow tetap memakai `AuthContext.js`.
- [x] Tidak ada file TypeScript.
- [x] Export web dan android berhasil.

## Fase 3 - Utility Dasar UI

- [x] 3.1 Buat `src/components/ui/utils/cn.js` - 2026-05-14 - File utility dibuat di struktur target `src/components/ui/utils/`.
- [x] 3.2 Implementasikan `cn()` memakai `clsx` dan `tailwind-merge` - 2026-05-14 - `cn()` menggabungkan conditional class dan resolve conflict Tailwind.
- [x] 3.3 Buat `src/components/ui/utils/text-context.js` untuk class text turunan button/card jika dibutuhkan - 2026-05-14 - `TextClassContext` dan `useTextClass()` tersedia untuk komponen compound fase berikutnya.
- [x] 3.4 Pastikan semua file `.js` - 2026-05-14 - Tidak ada file `.ts`/`.tsx`; route dan utility tetap JavaScript.
- [x] 3.5 Tambahkan JSDoc untuk setiap exported function/context - 2026-05-14 - `cn()`, `TextClassContext`, dan `useTextClass()` punya JSDoc.
- [x] 3.6 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil.
- [x] 3.7 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Contoh target `cn.js`:

```js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves Tailwind conflicts.
 * @param {...unknown} inputs - Class name values.
 * @returns {string} Merged class name.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

Checkpoint fase 3:

- [x] `cn()` tersedia dan dipakai minimal oleh satu komponen UI.
- [x] Tidak ada TypeScript.
- [x] Export web dan android berhasil.

## Fase 4 - Komponen `Text`

- [x] 4.1 Buat `src/components/ui/text.js` - 2026-05-14 - Komponen `Text` reusable dibuat di struktur UI target.
- [x] 4.2 Tambahkan variant sederhana: `default`, `title`, `subtitle`, `label`, `muted`, `error`, `code` - 2026-05-14 - Variant dasar tersedia lewat `class-variance-authority`.
- [x] 4.3 Gunakan NativeWind `className` pada React Native `Text` - 2026-05-14 - Komponen membungkus React Native `Text` dan meneruskan class hasil `cn()`.
- [x] 4.4 Hindari dependency icon atau context kompleks dulu - 2026-05-14 - Tidak ada dependency/icon baru; hanya memakai utility lokal `cn()` dan text context ringan dari Fase 3.
- [x] 4.5 Refactor satu screen kecil untuk memakai `Text` baru - 2026-05-14 - `BuildUpChecklistScreen.js` memakai `Text` baru untuk label, title, dan subtitle.
- [x] 4.6 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil.
- [x] 4.7 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 4:

- [x] `Text` baru dipakai minimal di satu screen.
- [x] Tampilan tidak blank.
- [x] Export web dan android berhasil.

## Fase 5 - Komponen `Button`

- [x] 5.1 Buat `src/components/ui/button.js` - 2026-05-14 - Komponen `Button` reusable dibuat.
- [x] 5.2 Port konsep variant dari template sumber ke JavaScript - 2026-05-14 - Variant dipindahkan dengan `class-variance-authority` tanpa TypeScript.
- [x] 5.3 Variant minimal: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link` - 2026-05-14 - Semua variant tersedia.
- [x] 5.4 Size minimal: `default`, `sm`, `lg`, `icon` - 2026-05-14 - Semua size tersedia.
- [x] 5.5 Gunakan `Pressable` - 2026-05-14 - `Button` memakai React Native `Pressable`.
- [x] 5.6 Tambahkan `android_ripple` via prop `android_ripple`, bukan className - 2026-05-14 - Ripple Android diset melalui prop `android_ripple`.
- [x] 5.7 Untuk iOS pressed opacity, gunakan callback `style={({ pressed }) => ...}` kecil bila perlu - 2026-05-14 - Feedback iOS memakai resolver style kecil.
- [x] 5.8 Jangan memakai `cssInterop` - 2026-05-14 - Tidak ada `cssInterop`.
- [x] 5.9 Refactor `AppButton.js` menjadi wrapper sementara atau langsung ganti import screen ke `ui/button.js` - 2026-05-14 - `AppButton.js` menjadi wrapper sementara ke `Button`.
- [x] 5.10 Jalankan export web dan android - 2026-05-14 - Export web dan Android berhasil.
- [x] 5.11 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 5:

- [x] Login button memakai `ui/button.js`.
- [x] Dashboard action memakai `ui/button.js` jika ada.
- [x] Build Up footer memakai `ui/button.js`.
- [x] Export web dan android berhasil.

## Fase 6 - Komponen `Input`

- [x] 6.1 Buat `src/components/ui/input.js` - 2026-05-14 - Komponen `Input` reusable dibuat.
- [x] 6.2 Gunakan React Native `TextInput` - 2026-05-14 - `Input` membungkus React Native `TextInput`.
- [x] 6.3 Tambahkan variant dasar: `default`, `error` - 2026-05-14 - Variant dasar tersedia.
- [x] 6.4 Pastikan `placeholderTextColor` eksplisit karena tidak semua warna placeholder aman via className - 2026-05-14 - Default `placeholderTextColor` eksplisit `#94A3B8`.
- [x] 6.5 Refactor `AppInput.js` menjadi wrapper sementara atau ganti import screen ke `ui/input.js` - 2026-05-14 - `AppInput.js` menjadi wrapper sementara ke `Input`; Build Up field memakai `Input` langsung.
- [x] 6.6 Pastikan Login tetap memakai validasi dari `src/utils/validators.js` - 2026-05-14 - `LoginScreen.js` tetap memakai `validateLoginForm`.
- [x] 6.7 Jalankan export web dan android - 2026-05-14 - Export web dan Android berhasil.
- [x] 6.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 6:

- [x] Login input memakai `ui/input.js`.
- [x] Build Up input memakai `ui/input.js` atau rencana refactor input form sudah dicatat.
- [x] Export web dan android berhasil.

## Fase 7 - Komponen `Card`

- [x] 7.1 Buat `src/components/ui/card.js` - 2026-05-14 - Komponen Card compound dibuat.
- [x] 7.2 Implementasikan `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` - 2026-05-14 - Semua bagian tersedia.
- [x] 7.3 Port pola dari template sumber ke JavaScript - 2026-05-14 - Pola compound dipindahkan ke `.js`.
- [x] 7.4 Gunakan token NativeWind yang stabil di project sekarang, misalnya `bg-white`, `border-slate-200`, `text-slate-950` - 2026-05-14 - Token slate/white stabil dipakai.
- [x] 7.5 Refactor `InfoCard.js` menjadi wrapper sementara atau ganti import ke `ui/card.js` - 2026-05-14 - `InfoCard.js` menjadi wrapper ke `Card`, `CardContent`, dan `Text`.
- [x] 7.6 Refactor kartu statistik Dashboard ke `Card` - 2026-05-14 - Stat cards Dashboard memakai `Card` dan `CardContent`.
- [x] 7.7 Jalankan export web dan android - 2026-05-14 - Export web dan Android berhasil.
- [x] 7.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 7:

- [x] Dashboard stat cards memakai `Card`.
- [x] Login form container bisa memakai `Card` jika tidak mengganggu layout.
- [x] Export web dan android berhasil.

## Fase 8 - Komponen Tambahan Ringan

- [x] 8.1 Buat `src/components/ui/badge.js` - 2026-05-14 - `Badge` reusable dibuat.
- [x] 8.2 Buat `src/components/ui/separator.js` - 2026-05-14 - `Separator` reusable dibuat.
- [x] 8.3 Buat `src/components/ui/spinner.js` - 2026-05-14 - `Spinner` reusable dibuat.
- [x] 8.4 Buat `src/components/ui/index.js` untuk export semua UI component - 2026-05-14 - Barrel export tersedia.
- [x] 8.5 Refactor loading state di `app/_layout.js` atau route auth gate memakai `Spinner` - 2026-05-14 - Route auth gate `app/index.js`, `app/login.js`, dan `app/build-up-checklist.js` memakai `Spinner`.
- [x] 8.6 Refactor status kecil Dashboard memakai `Badge` jika relevan - 2026-05-14 - Label Dashboard memakai `Badge`; garis menu memakai `Separator`.
- [x] 8.7 Jalankan export web dan android - 2026-05-14 - Export web dan Android berhasil.
- [x] 8.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 8:

- [x] `src/components/ui/index.js` tersedia.
- [x] Komponen ringan dipakai minimal di satu tempat.
- [x] Export web dan android berhasil.

## Fase 9 - Theme Token

- [x] 9.1 Evaluasi apakah perlu `tailwind.config.js` - 2026-05-14 - Tidak perlu pada fase ini karena project memakai Tailwind CSS 4 dan NativeWind 5 preview dengan pola CSS-first melalui `global.css`.
- [x] 9.2 Jika perlu, buat `tailwind.config.js` JavaScript dan pastikan content path hanya `.js`, `.jsx`, `.json` - 2026-05-14 - Tidak dibuat; keputusan teknis dicatat agar tidak menambah konfigurasi paralel yang belum diperlukan.
- [x] 9.3 Jangan copy config template sumber mentah karena path-nya memakai `.tsx`, typed routes, dan struktur demo yang belum tentu sesuai flow MAU APP - 2026-05-14 - Tidak ada config TypeScript atau struktur demo template yang dicopy.
- [x] 9.4 Tambahkan token minimal: `background`, `foreground`, `primary`, `muted`, `border`, `card`, `destructive` - 2026-05-14 - Token semantik ditambahkan via `@theme` di `global.css`, plus foreground token untuk kontras teks.
- [x] 9.5 Update `global.css` dengan CSS variables jika sudah terbukti kompatibel dengan NativeWind versi project - 2026-05-14 - `@theme` CSS variables dipakai dan primitive UI utama mulai memakai class semantik seperti `bg-primary`, `text-foreground`, `border-border`, dan `bg-card`.
- [x] 9.6 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil.
- [x] 9.7 Jika ada blank screen, rollback perubahan theme token dan catat blocker - 2026-05-14 - Tidak ada error bundling atau `nativewind/jsx-runtime`; rollback tidak diperlukan.
- [x] 9.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 9:

- [x] Token theme berjalan di web.
- [x] Token theme berjalan di android export.
- [x] Tidak ada `nativewind/jsx-runtime` error.

## Fase 10 - Refactor Screen ke UI Kit

- [x] 10.1 Refactor `LoginScreen.js` memakai `Text`, `Button`, `Input`, `Card` - 2026-05-14 - Login screen memakai import langsung dari `src/components/ui`; wrapper `AppButton` dan `AppInput` tidak lagi dipakai di screen.
- [x] 10.2 Refactor `DashboardScreen.js` memakai `Text`, `Card`, `Badge`, `Separator` - 2026-05-14 - Dashboard memakai `Text` dari UI kit secara langsung bersama `Card`, `Badge`, dan `Separator`.
- [x] 10.3 Refactor `BuildUpChecklistScreen.js` memakai `Text`, `Button`, `Input`, `Card` - 2026-05-14 - Footer memakai `Button` UI kit dan form section memakai `Card`/`CardContent`.
- [x] 10.4 Pastikan semua screen tetap memakai `ScreenLayout` - 2026-05-14 - `LoginScreen`, `DashboardScreen`, dan `BuildUpChecklistScreen` masih memakai `ScreenLayout`.
- [x] 10.5 Pastikan screen tidak memanggil `fetch()` langsung - 2026-05-14 - `rg "fetch\\(" mobile-app\\src\\screens mobile-app\\src\\components` kosong; API call tetap di service.
- [x] 10.6 Pastikan auth tetap dari `useAuth()` - 2026-05-14 - Login dan Dashboard tetap memakai `useAuth()`; route guard juga tetap memakai `AuthContext`.
- [x] 10.7 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil; satu retry web dilakukan karena percobaan pertama exit tanpa output.
- [x] 10.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 10:

- [x] Semua screen existing memakai komponen `src/components/ui`.
- [x] `AppButton.js`, `AppInput.js`, `InfoCard.js` sudah dihapus atau menjadi compatibility wrapper dengan catatan.
- [x] Export web dan android berhasil.

## Fase 11 - Komponen Menengah yang Ditunda

- [x] 11.1 Evaluasi kebutuhan `switch` - 2026-05-14 - Belum ada kebutuhan UI/flow; ditunda agar dependency dan state tambahan tidak masuk prematur.
- [x] 11.2 Evaluasi kebutuhan `checkbox` - 2026-05-14 - Belum ada form checklist yang membutuhkan checkbox reusable; ditunda sampai flow validasi item jelas.
- [x] 11.3 Evaluasi kebutuhan `dialog` - 2026-05-14 - Belum dibutuhkan untuk bug saat ini; alert/login flow tetap existing.
- [x] 11.4 Evaluasi kebutuhan `sheet` - 2026-05-14 - Tidak dipilih karena belum ada kebutuhan bottom sheet dan dependency gesture belum diperlukan.
- [x] 11.5 Evaluasi kebutuhan `drawer` - 2026-05-14 - Dibutuhkan untuk memperbaiki menu Dashboard; dibuat `src/components/ui/drawer.js` berbasis `Modal`, `SafeAreaView`, dan NativeWind tanpa dependency tambahan.
- [x] 11.6 Untuk setiap komponen, catat dependency tambahan sebelum install - 2026-05-14 - Drawer tidak membutuhkan dependency baru; `switch`, `checkbox`, `dialog`, dan `sheet` tetap ditunda.
- [x] 11.7 Jangan install `@gorhom/bottom-sheet` atau `react-native-gesture-handler` sebelum kebutuhan sheet/drawer jelas - 2026-05-14 - Tidak ada dependency native baru yang dipasang.
- [x] 11.8 Jika install native dependency, gunakan `npx expo install` bila tersedia - 2026-05-14 - Tidak berlaku karena tidak ada dependency yang diinstall.
- [x] 11.9 Jalankan export web dan android setelah setiap dependency baru - 2026-05-14 - Tidak ada dependency baru; tetap menjalankan `npm run doctor`, export web, dan export Android setelah komponen Drawer dibuat.
- [x] 11.10 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 11:

- [x] Dependency tambahan punya alasan bisnis/UI yang jelas.
- [x] Komponen menengah tidak membuat Expo Go/dev workflow rusak.
- [x] Export web dan android berhasil.

## Fase 12 - Permission Components

- [x] 12.1 Jangan adopsi `permission-requester` sebelum ada fitur native yang butuh permission - 2026-05-14 - Kebutuhan native sudah jelas: scan barcode AWB/MAWB dan ULD di Build Up Checklist; tidak mengadopsi permission-requester template mentah.
- [x] 12.2 Jika butuh kamera, evaluasi `expo-camera` - 2026-05-14 - Menggunakan `expo-camera` SDK 54 dengan `CameraView`, `useCameraPermissions`, dan `barcodeScannerSettings`; Build Up memakai `BarcodeScanner`, sementara `QrScanner` dipertahankan untuk kebutuhan QR nanti.
- [x] 12.3 Jika butuh lokasi, evaluasi `expo-location` - 2026-05-14 - Tidak dibutuhkan untuk flow scan barcode saat ini; tidak dipasang.
- [x] 12.4 Jika butuh notifikasi, evaluasi batas Expo Go dan development build - 2026-05-14 - Tidak dibutuhkan untuk flow scan barcode saat ini; tidak dipasang.
- [x] 12.5 Semua permission final dan proses bisnis tetap harus melalui backend jika terkait operasional - 2026-05-14 - Scanner hanya mengisi form lokal; validasi final dan simpan data tetap harus lewat backend/API.
- [x] 12.6 Tambahkan dokumentasi permission ke README jika dependency dipasang - 2026-05-14 - README diperbarui dengan catatan `expo-camera`, barcode scanner, QR scanner reusable, `scheme`, dan batas review device fisik.
- [x] 12.7 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil setelah `expo-camera` dipasang.
- [x] 12.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 12:

- [x] Tidak ada permission module tanpa kebutuhan.
- [x] README menjelaskan batas Expo Go jika ada permission native.
- [x] Export web dan android berhasil.

## Fase 13 - Cleanup Struktur Lama

- [x] 13.1 Cari import `AppButton`, `AppInput`, `InfoCard` - 2026-05-14 - Tidak ada import aktif di `src/`, `app/`, atau `App.js`; hanya catatan historis di dokumen.
- [x] 13.2 Jika tidak dipakai, hapus file lama - 2026-05-14 - `src/components/AppButton.js`, `src/components/AppInput.js`, dan `src/components/InfoCard.js` dihapus.
- [x] 13.3 Jika masih dipakai oleh modul lain, ubah menjadi wrapper tipis ke `src/components/ui` - 2026-05-14 - Tidak diperlukan karena semua screen memakai UI kit langsung.
- [x] 13.4 Rapikan import dari `src/components/ui/index.js` - 2026-05-14 - Screen memakai barrel export; UI kit juga mengekspor `Drawer`, `BarcodeScanner`, dan `QrScanner`.
- [x] 13.5 Jalankan `rg "StyleSheet.create" src` dan pastikan hanya tersisa untuk kasus yang memang tidak cocok dengan NativeWind - 2026-05-14 - Hasil kosong.
- [x] 13.6 Jalankan `rg "fetch\\(" src/screens src/components` dan pastikan kosong - 2026-05-14 - Hasil kosong.
- [x] 13.7 Jalankan export web dan android - 2026-05-14 - `npm run doctor`, export web, dan export Android berhasil setelah cleanup.
- [x] 13.8 Update checklist dan progress report - 2026-05-14 - Checklist dan progress report root diperbarui.

Checkpoint fase 13:

- [x] Struktur UI baru menjadi sumber utama.
- [x] Tidak ada duplicate component yang membingungkan.
- [x] Export web dan android berhasil.

## Fase 14 - Dokumentasi dan Agent Update

- [x] 14.1 Update `mobile_agent.md` dengan aturan `src/components/ui` - 2026-05-14 - Agent kini mewajibkan UI primitive baru berada di `src/components/ui`, diekspor dari barrel, memakai NativeWind, dan tetap JavaScript-only.
- [x] 14.2 Update `README.md` dengan cara membuat komponen UI baru - 2026-05-14 - README menambahkan langkah membuat UI component, lokasi file, JSDoc, export barrel, dan batas business logic.
- [x] 14.3 Tambahkan contoh pemakaian `Button`, `Text`, `Card`, `Input` - 2026-05-14 - README menambahkan contoh `ExampleForm` dengan `Button`, `Text`, `Card`, `CardContent`, dan `Input`.
- [x] 14.4 Tambahkan catatan bahwa template sumber TypeScript tidak boleh di-copy mentah - 2026-05-14 - README dan agent menegaskan tidak boleh copy `.ts`, `.tsx`, typed routes, `tsconfig.json`, atau `nativewind-env.d.ts`.
- [x] 14.5 Tambahkan catatan dependency yang ditunda - 2026-05-14 - README dan agent mencatat `Dialog`, `Sheet`, `Select`, `Checkbox`, `Switch`, gesture drawer, dan dependency native terkait tetap butuh review terpisah.
- [x] 14.6 Update progress report root - 2026-05-14 - Progress report root diperbarui.
- [x] 14.7 Jalankan export web dan android final - 2026-05-14 - `npm run doctor`, export web, dan export Android final berhasil.

Checkpoint fase 14:

- [x] Dokumentasi project sinkron dengan struktur actual.
- [x] Agent instruction sinkron dengan pola UI baru.
- [x] Export final berhasil.

## Fase 15 - Acceptance Review

- [x] 15.1 Review Login di web - 2026-05-14 - Headless Chromium membuka `/login` dan menemukan teks `Login operasional`.
- [ ] 15.2 Review Login di HP fisik Expo Go - Blocker: membutuhkan konfirmasi dari device fisik user; tidak bisa divalidasi langsung oleh Codex dari terminal.
- [x] 15.3 Review Dashboard di web - 2026-05-14 - Headless Chromium masuk Dashboard dengan session acceptance lokal dan menemukan `Popular services`; search field melebar 345px.
- [ ] 15.4 Review Dashboard di HP fisik Expo Go - Blocker: membutuhkan konfirmasi dari device fisik user; khususnya drawer, bottom nav, dan safe-area.
- [x] 15.5 Review Build Up Checklist di web - 2026-05-14 - Headless Chromium membuka Build Up dan menemukan `Checklist`, `MAWB Number`, `ULD Number`, serta 2 tombol `Scan`.
- [ ] 15.6 Review Build Up Checklist di HP fisik Expo Go - Blocker: membutuhkan konfirmasi dari device fisik user; khususnya kamera dan scan barcode.
- [ ] 15.7 Cek orientasi portrait di Android - Blocker: membutuhkan HP fisik atau emulator Android; `app.json` sudah mengunci `orientation: "portrait"`.
- [ ] 15.8 Cek keyboard tidak menutup input Login - Blocker: membutuhkan HP fisik/emulator dengan virtual keyboard; layout sudah memakai `ScreenLayout keyboardAware`.
- [x] 15.9 Cek navigasi Dashboard atau tab/group Expo Router tidak menutup konten - 2026-05-14 - Web acceptance membuka Dashboard lalu route Build Up via Expo Router; konten utama tetap terlihat.
- [x] 15.10 Cek tidak ada blank putih/hitam ketika reload - 2026-05-14 - Reload pada route Build Up tetap menampilkan `Checklist`.
- [x] 15.11 Catat screenshot atau ringkasan hasil manual QA di progress report - 2026-05-14 - Ringkasan acceptance web dan blocker device fisik dicatat di progress report.

Checkpoint fase 15:

- [x] Semua screen existing tampil di web acceptance.
- [x] Tidak ada runtime error utama di console Metro.
- [x] Tidak ada blank screen pada web acceptance.
- [x] Checklist ini sudah diperbarui untuk semua step yang dikerjakan.

## Daftar Komponen yang Disarankan untuk Adopsi Pertama

- [x] `Text` - 2026-05-14 - Tersedia di `src/components/ui/text.js`.
- [x] `Button` - 2026-05-14 - Tersedia di `src/components/ui/button.js`.
- [x] `Input` - 2026-05-14 - Tersedia di `src/components/ui/input.js`.
- [x] `Card` - 2026-05-14 - Tersedia di `src/components/ui/card.js`.
- [x] `Badge` - 2026-05-14 - Tersedia di `src/components/ui/badge.js`.
- [x] `Separator` - 2026-05-14 - Tersedia di `src/components/ui/separator.js`.
- [x] `Spinner` - 2026-05-14 - Tersedia di `src/components/ui/spinner.js`.

## Daftar Komponen yang Perlu Evaluasi Terpisah

- [x] `Dialog` - 2026-05-14 - Dievaluasi dan ditunda; belum ada kebutuhan flow modal baru.
- [x] `Sheet` - 2026-05-14 - Dievaluasi dan ditunda; belum memasang `@gorhom/bottom-sheet` atau gesture dependency.
- [x] `Drawer` - 2026-05-14 - Diimplementasikan sebagai `src/components/ui/drawer.js` memakai `Modal` bawaan tanpa dependency native tambahan.
- [x] `Select` - 2026-05-14 - Dievaluasi dan ditunda; perlu desain UX mobile sebelum memilih dependency.
- [x] `Checkbox` - 2026-05-14 - Dievaluasi dan ditunda; belum ada form yang membutuhkan checkbox reusable.
- [x] `Switch` - 2026-05-14 - Dievaluasi dan ditunda; bisa memakai React Native `Switch` saat ada kebutuhan nyata.
- [x] `PermissionRequester` - 2026-05-14 - Tidak diadopsi mentah; permission kamera ditangani langsung oleh `BarcodeScanner`/`QrScanner`.

## Risiko Utama

- NativeWind versi project berbeda dari template sumber.
- Template sumber TypeScript-first, sedangkan project ini JavaScript-only.
- React Navigation/AppNavigator sudah dihapus dari source setelah Expo Router stabil.
- Komponen advanced bisa menambah native dependency dan memperumit Expo Go.
- CSS variable theme dari template sumber perlu validasi bertahap.

## Perintah Verifikasi Standar

Jalankan setelah setiap fase yang mengubah kode:

```bash
npm run doctor
npx expo export --clear --platform web --output-dir .expo-web-check
npx expo export --clear --platform android --output-dir .expo-android-check
```

Hapus build artifact setelah selesai:

```powershell
Remove-Item -Recurse -Force .expo-web-check, .expo-android-check
```

Jalankan manual preview:

```bash
npx expo start --clear --host lan
npm run web -- --clear
```

## Catatan Implementasi

- Setiap step yang selesai wajib mengubah checkbox dari `[ ]` menjadi `[x]`.
- Setiap step yang gagal wajib mencatat blocker di baris step yang sama.
- Jangan menyelesaikan beberapa fase besar tanpa commit/review antara.
- Rekomendasi commit message setelah fase 1-8:

```text
feat(mobile): add reusable UI foundation
```

- Rekomendasi commit message setelah refactor screen:

```text
refactor(mobile): adopt reusable UI components in screens
```
