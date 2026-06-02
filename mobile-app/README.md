# MAU APP Mobile

Frontend mobile MAU APP untuk operasional gudang cargo lini 1. Project ini memakai React Native + Expo, Expo Router, NativeWind, dan JavaScript saja.

Mobile app hanya berperan sebagai client. Business logic final, auth final, permission, audit log, validasi data, dan integrasi eksternal tetap berada di backend FastAPI.

## Ringkasan Teknologi

- React Native + Expo SDK 54
- Expo Router sebagai routing aktif
- JavaScript saja, tanpa TypeScript
- NativeWind untuk styling utama
- AsyncStorage untuk penyimpanan token
- Expo Camera untuk scanner barcode/QR
- EAS Build untuk APK preview dan AAB production

## Struktur Project

```text
mobile-app/
├── app/                  # Route Expo Router
├── assets/               # Icon, splash, dan asset aplikasi
├── src/
│   ├── components/
│   │   ├── layout/       # ScreenLayout, ScreenHeader, layout bersama
│   │   └── ui/           # Primitive UI reusable
│   ├── config/           # Konfigurasi runtime/env
│   ├── contexts/         # Global state, termasuk AuthContext
│   ├── screens/          # Screen aplikasi
│   ├── services/         # API service, auth service, storage service
│   ├── styles/           # Token/style bersama
│   └── utils/            # Helper dan validasi
├── App.js
├── app.json
├── eas.json
├── global.css
├── metro.config.js
├── package.json
└── README.md
```

## Aturan Arsitektur Mobile

- Screen tidak boleh memanggil `fetch()` langsung. Semua request backend lewat service di `src/services/`.
- API base URL dibaca dari `src/config/env.js` melalui variable `EXPO_PUBLIC_*`.
- Auth state dikelola oleh `src/contexts/AuthContext.js`.
- Token disimpan melalui `src/services/storageService.js`.
- Validasi frontend hanya untuk UX; validasi final tetap di backend.
- Jangan menambahkan backend, database layer, route server, atau integrasi server-side di `mobile-app/`.

## Instalasi Awal

Jalankan dari root project mobile:

```powershell
cd C:\Users\wisnu\Documents\Belajar\materialize-project\mobile-app
npm install
```

Jika dependency Expo perlu dicek:

```powershell
npm run doctor
```

## Konfigurasi Environment

Salin `.env.example` ke `.env`:

```powershell
Copy-Item .env.example .env
```

Contoh `.env` untuk development lokal di komputer yang sama:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_AUTH_LOGIN_PATH=/auth/login
EXPO_PUBLIC_AUTH_PROFILE_PATH=/auth/me
EXPO_PUBLIC_API_TIMEOUT_MS=10000
EXPO_PUBLIC_USE_MOCK_AUTH=false
```

Untuk testing dari HP fisik melalui Expo Go, jangan gunakan `127.0.0.1` karena itu akan menunjuk ke HP, bukan ke komputer. Gunakan IP LAN komputer:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.12:8000
```

Ganti `192.168.1.12` dengan IP komputer yang menjalankan backend FastAPI.

## Menjalankan Backend Lokal

Dari folder backend:

```powershell
cd C:\Users\wisnu\Documents\Belajar\materialize-project\materialize-fastapi
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Gunakan `--host 0.0.0.0` agar backend bisa diakses dari HP fisik di jaringan LAN yang sama.

Pastikan firewall Windows mengizinkan koneksi ke port `8000` jika HP tidak bisa mengakses backend.

## Menjalankan Mobile di Local

Dari folder mobile:

```powershell
cd C:\Users\wisnu\Documents\Belajar\materialize-project\mobile-app
npm start
```

Script `npm start` menjalankan:

```text
expo start --clear --host lan
```

Mode ini cocok untuk development harian dan testing dengan Expo Go.

## Menjalankan dengan Expo Go

1. Install aplikasi **Expo Go** dari Play Store.
2. Pastikan HP dan komputer berada di jaringan Wi-Fi/LAN yang sama.
3. Pastikan `.env` memakai API base URL berbasis IP LAN komputer, contoh `http://192.168.1.12:8000`.
4. Jalankan backend FastAPI dengan `--host 0.0.0.0`.
5. Jalankan `npm start` dari folder `mobile-app`.
6. Scan QR code Expo dari terminal/browser memakai Expo Go.

Catatan penting:

- Jika app menampilkan error backend `127.0.0.1`, berarti `.env` masih memakai localhost atau bundle lama masih tercache.
- Setelah mengubah `.env`, restart Expo dengan `npm start` atau `npx expo start --clear --host lan`.
- Expo Go cocok untuk development. Untuk uji APK installable, gunakan EAS Build profile `preview`.

## Menjalankan di Android Emulator atau Device via Native Run

Gunakan:

```powershell
npm run android
```

Script ini menjalankan `expo run:android`, sehingga membutuhkan Android Studio, Android SDK, dan konfigurasi native Android yang siap.

Untuk development cepat, Expo Go biasanya lebih praktis. Gunakan `npm run android` ketika perlu menguji native build dari folder `android/`.

## Menjalankan Web Preview

Untuk membuka UI mobile di browser:

```powershell
npm run web
```

Mode web berguna untuk cek layout cepat. Tetap gunakan API URL yang bisa dijangkau browser. Jika browser tidak bisa mengakses `127.0.0.1` dari konteks tertentu, gunakan IP LAN.

## Auth dan Akun Demo

Mock login dapat dipakai untuk pengembangan UI terisolasi:

```env
EXPO_PUBLIC_USE_MOCK_AUTH=true
```

Akun demo:

```text
Email: admin@admin.com
Password: password123
```

Untuk memakai backend auth asli:

```env
EXPO_PUBLIC_USE_MOCK_AUTH=false
```

Endpoint yang dipakai:

```text
POST /auth/login
GET /auth/me
```

## Scanner dan Permission Kamera

Build Up Checklist memakai `expo-camera` untuk scan barcode AWB/MAWB dan ULD.

Perilaku scanner:

- Permission kamera diminta saat user membuka scanner.
- Payload barcode hanya mengisi field form.
- Validasi final dan penyimpanan tetap dilakukan backend API.

Konfigurasi permission kamera ada di `app.json` melalui plugin `expo-camera`.

## Konfigurasi EAS Build

Project memakai `eas.json` dengan dua profile Android utama:

- `preview`: menghasilkan APK installable untuk testing internal.
- `production`: menghasilkan Android App Bundle/AAB untuk Play Store.

Profile saat ini memakai API production:

```json
{
  "EXPO_PUBLIC_API_BASE_URL": "https://api.mitraadira.com",
  "EXPO_PUBLIC_USE_MOCK_AUTH": "false"
}
```

Variable yang dibaca aplikasi harus memakai prefix `EXPO_PUBLIC_`. Jangan memakai `API_URL` karena tidak dibaca oleh `src/config/env.js`.

## Mode Native Android Project

Project ini memiliki folder native `android/`, sehingga EAS Build akan menampilkan log seperti ini:

```text
Skipped running "expo prebuild" because the "android" directory already exists.
```

Itu normal untuk project ini. Artinya EAS tidak menjalankan `expo prebuild` ulang dan tidak otomatis menyalin semua field native dari `app.json` ke folder Android.

Dampaknya:

- Konfigurasi Android utama harus dijaga langsung di folder `android/`.
- `android/app/build.gradle` menjadi sumber versi Android untuk `versionName` dan `versionCode`.
- `android/app/src/main/AndroidManifest.xml` menjadi tempat konfigurasi native seperti permission, deep link scheme, orientation, dan `android:usesCleartextTraffic`.
- `app.json` tetap dipakai untuk konfigurasi Expo/Metro/EAS yang masih relevan, tetapi jangan taruh field yang tidak valid menurut schema Expo.

Karena keputusan project saat ini adalah mempertahankan folder native `android/`, check `expo.doctor.appConfigFieldsNotSyncedCheck` dinonaktifkan di `package.json`. Ini mengikuti opsi resmi Expo Doctor untuk project yang sengaja mengelola native folder sendiri.

## Versi Aplikasi Android

Project ini sudah memiliki folder native `android/`, sehingga EAS Android build membaca versi dari Gradle:

```text
android/app/build.gradle
```

Nilai yang tampil di dashboard Expo berbentuk:

```text
versionName (versionCode)
```

Contoh:

```text
1.0.1 (2)
```

Saat menaikkan versi Android, sinkronkan file berikut:

- `android/app/build.gradle`: ubah `versionName` dan naikkan `versionCode`.
- `app.json`: ubah `expo.version` dan `expo.android.versionCode` agar app config tetap selaras.
- `package.json` dan `package-lock.json`: ubah versi package jika rilis aplikasi ikut naik.

Catatan: `versionCode` wajib naik untuk setiap build Android yang akan diunggah ke Play Store atau dibedakan sebagai build baru.

## Build APK Preview ke Expo

Gunakan profile `preview` untuk membuat APK yang bisa langsung diinstall ke HP:

```powershell
cd C:\Users\wisnu\Documents\Belajar\materialize-project\mobile-app
eas build --platform android --profile preview
```

Atau lewat npm script:

```powershell
npm run build:android:preview
```

Alur build:

1. EAS CLI mengarsipkan project.
2. Project di-upload ke server Expo.
3. Build masuk queue.
4. Setelah selesai, Expo menyediakan link download APK.
5. Download APK dari dashboard Expo atau link terminal.
6. Install APK ke HP untuk testing.

Jika terminal dihentikan dengan `Ctrl+C` setelah upload selesai, job di server Expo bisa tetap berjalan. Cek status dan batalkan build dari dashboard Expo jika konfigurasi build salah.

## Build Production AAB

Gunakan profile `production` untuk membuat AAB:

```powershell
cd C:\Users\wisnu\Documents\Belajar\materialize-project\mobile-app
eas build --platform android --profile production
```

Atau lewat npm script:

```powershell
npm run build:android:production
```

AAB dipakai untuk distribusi Play Store. Untuk testing install langsung ke HP, gunakan profile `preview` karena menghasilkan APK.

## EAS Environment di Dashboard Expo

Untuk build cloud, `.env`, `.env.production`, dan `.env.local` tidak ikut di-upload karena dikecualikan oleh `.easignore`.

Ada dua cara aman mengatur env build:

1. Simpan variable public di `eas.json`, seperti konfigurasi saat ini.
2. Simpan variable di dashboard Expo/EAS Environment untuk environment `preview` dan `production`.

Jika memakai dashboard Expo, pastikan variable berikut ada:

```text
EXPO_PUBLIC_API_BASE_URL=https://api.mitraadira.com
EXPO_PUBLIC_USE_MOCK_AUTH=false
```

Best practice Expo: variable yang dipakai JavaScript client harus memakai prefix `EXPO_PUBLIC_`, dan nilainya akan di-inline saat build.

## Build APK Lokal

Build lokal memakai EAS `--local`, sehingga build berjalan di mesin sendiri.

Prasyarat:

- Sudah login Expo: `npx eas-cli login`
- Node.js dan npm tersedia.
- Android Studio, Android SDK, dan Android NDK tersedia.
- Java/OpenJDK tersedia.
- Untuk Windows, jalankan local EAS build dari WSL2. Local EAS build resmi didukung di macOS/Linux; Windows native tidak resmi didukung untuk `eas build --local`.

Contoh dari WSL/Linux:

```bash
cd mobile-app
mkdir -p build/android
export EAS_LOCAL_BUILD_ARTIFACTS_DIR="$PWD/build/android"
npx eas-cli build --platform android --profile preview --local
```

Output APK akan disalin ke:

```text
mobile-app/build/android/
```

Install ke Android device/emulator:

```bash
adb install build/android/*.apk
```

Jika memakai PowerShell untuk install file APK tertentu:

```powershell
adb install .\build\android\nama-file.apk
```

## Troubleshooting

### APK Mengarah ke `127.0.0.1`

Penyebab umum:

- `eas.json` tidak mengisi `EXPO_PUBLIC_API_BASE_URL`.
- EAS Environment dashboard belum berisi `EXPO_PUBLIC_API_BASE_URL`.
- Build lama masih dipakai dan belum rebuild setelah env diperbaiki.

Solusi:

```powershell
eas build --platform android --profile preview
```

Download APK baru dari Expo, lalu install ulang di HP.

### Expo Go Tidak Bisa Menghubungi Backend

Cek hal berikut:

- HP dan komputer berada di jaringan yang sama.
- Backend berjalan dengan `--host 0.0.0.0`.
- `.env` memakai IP LAN komputer, bukan `127.0.0.1`.
- Firewall Windows mengizinkan port `8000`.
- Restart Expo dengan cache bersih:

```powershell
npx expo start --clear --host lan
```

### Env Belum Terbaca

Variable yang dipakai app harus diawali `EXPO_PUBLIC_`.

Setelah mengubah `.env`, restart Expo:

```powershell
npm start
```

### Android SDK Tidak Ditemukan

Cek environment variable:

```text
ANDROID_HOME
ANDROID_SDK_ROOT
```

Pastikan Android Studio dan SDK sudah terpasang.

### Melihat Folder Kerja EAS Local Build

Jika build lokal gagal dan perlu melihat folder kerja EAS:

```bash
export EAS_LOCAL_BUILD_SKIP_CLEANUP=1
npx eas-cli build --platform android --profile preview --local
```

### Metro atau NativeWind Bermasalah

Restart Expo dengan cache bersih:

```powershell
npx expo start --clear --host lan
```

## Komponen UI dan Layout

Primitive UI reusable berada di `src/components/ui/`.

Komponen yang tersedia:

- `Text`
- `Button`
- `Input`
- `Card`
- `Badge`
- `Separator`
- `Spinner`
- `Drawer`
- `BarcodeScanner`
- `QrScanner`

Gunakan `ScreenLayout` dan `ScreenHeader` dari `src/components/layout/` untuk screen baru agar safe area, scroll, dan header tetap konsisten.

## Aturan Kode

Lihat instruksi project:

```text
../AGENTS.md
mobile_agent.md
nativewind_agent.md
```

Ringkasan aturan utama:

- Tetap JavaScript-only.
- Jangan membuat file `.ts` atau `.tsx`.
- Jangan memanggil API langsung dari screen.
- Jangan commit `.env`, token, secret, atau build artifact.
- Gunakan NativeWind untuk styling utama.
- Gunakan service layer untuk request backend.

## Referensi Resmi

- Expo Environment Variables: <https://docs.expo.dev/guides/environment-variables/>
- EAS Environment Variables: <https://docs.expo.dev/eas/environment-variables/>
- EAS APK Builds: <https://docs.expo.dev/build-reference/apk/>
- EAS Local Builds: <https://docs.expo.dev/build-reference/local-builds/>
