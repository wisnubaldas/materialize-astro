# Qt Designer Integration Guide

## Tujuan
Dokumen ini menjelaskan workflow integrasi Qt Designer pada desktop app agar layout mudah dikembangkan tanpa mencampur business logic.

## Prinsip Arsitektur
- File `.ui` hanya untuk layout/frame/style.
- File `views/*.py` hanya untuk load `.ui`, binding event, dan render state.
- Semua logic tetap di `viewmodels/`, `services/`, dan `api/`.

## Lokasi File UI
- Simpan semua UI di:
  - `app/resources/ui/`
- File saat ini:
  - `app/resources/ui/login_view.ui`
  - `app/resources/ui/main_window.ui`
  - `app/resources/ui/warehouse/weighing_view.ui`
  - `app/resources/ui/warehouse/buildup_view.ui`

## Cara Edit dengan Qt Designer
1. Jalankan `pyside6-designer`.
2. Buka file `.ui` pada `app/resources/ui`.
3. Edit layout/frame/widget sesuai kebutuhan.
4. Pastikan `objectName` widget tidak berubah sembarangan.
5. Simpan file `.ui`.

## Catatan Tema
- Desktop app menggunakan style bawaan Qt (`Fusion`) untuk stabilitas.
- Tidak ada stylesheet plugin eksternal wajib saat runtime.
- Preview Qt Designer umumnya sudah mendekati runtime karena keduanya memakai UI native Qt.
- Style global aplikasi berada di:
  - `app/resources/styles/app.qss`

## Konfigurasi QSS di Qt Designer (QRC)
1. Pastikan file resource tersedia:
   - `app/resources/resources.qrc`
2. Di Qt Designer, buka panel **Resource Browser**.
3. Klik ikon **pensil** lalu pilih **Open Resource File...**
4. Pilih file `app/resources/resources.qrc`.
5. Setelah resource ter-load, set property `styleSheet` pada root form:
   - `@import url(:/styles/styles/app.qss);`
6. Jalankan `Preview` (`Ctrl+R`) untuk melihat hasil.

## Sinkronisasi Resource Runtime
- Setelah mengubah `resources.qrc`, regenerate file Python resource:
  - `pyside6-rcc app/resources/resources.qrc -o app/resources/resources_rc.py`
- File `resources_rc.py` di-import saat startup app agar path `:/...` aktif.

## Aturan Icon di Designer
- Jangan gunakan path absolut OS (contoh: `C:\Users\...\Pictures\icon.png`) pada properti icon widget.
- Simpan icon di `app/resources/icons/`.
- Gunakan path resource project yang stabil agar tidak rusak saat dijalankan di mesin lain.
- Setelah menambahkan icon, validasi kembali dengan menjalankan app:
  - `python -m app.main`

## Kontrak Object Name
### Login View
- `emailInput`
- `passwordInput`
- `loginButton`
- `statusLabel`

### Main Window
- `userInfoLabel`
- `menuList`
- `logoutButton`
- `stackPages`
- `dashboardPage`
- `weighingPage`
- `buildupPage`

### Weighing View
- `masterAwbInput`
- `weightInput`
- `saveButton`
- `clearButton`
- `statusLabel`

### Buildup View
- `masterAwbListInput`
- `lookupButton`
- `resultHintLabel`

## Pola Load UI
- Gunakan helper: `app/views/ui_loader.py`.
- Jangan hardcode layout widget di view jika sudah ada di `.ui`.
- Jika widget wajib tidak ditemukan, view harus fail-fast dengan `RuntimeError`.

## Checklist Saat Menambah Screen
1. Buat/ubah `.ui` di `app/resources/ui`.
2. Tambahkan binding di `views/*.py`.
3. Pastikan tidak ada API call langsung dari view.
4. Tambahkan/ubah test pada viewmodel/service yang relevan.
5. Jalankan `python -m compileall app` dan `python -m pytest`.
