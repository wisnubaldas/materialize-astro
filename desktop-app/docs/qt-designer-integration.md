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
