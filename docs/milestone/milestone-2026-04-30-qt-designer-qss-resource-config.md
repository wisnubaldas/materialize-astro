# Milestone Analysis - Qt Designer QSS Resource Configuration

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Aplikasi sudah memakai QSS global (`app.qss`) di runtime.
- Qt Designer belum otomatis mengetahui file QSS eksternal tanpa resource configuration.

## Gap Analysis (Current vs Target)
- Current: Designer preview tidak konsisten karena QSS belum dimuat dari resource.
  Target: Designer dapat memuat `app.qss` melalui resource path `:/...`.
- Current: Runtime load QSS belum didaftarkan via QRC Python module.
  Target: Runtime import `resources_rc.py` sehingga resource path tersedia stabil.

## Rencana Implementasi
1. Tambah `resources.qrc` berisi `styles/app.qss`.
2. Generate `resources_rc.py` via `pyside6-rcc`.
3. Import `resources_rc` pada startup app.
4. Update loader stylesheet untuk membaca dari `:/styles/styles/app.qss` (fallback file system).
5. Update dokumentasi langkah konfigurasi di Qt Designer.

## Estimasi Risiko
- Risiko: Lupa regenerate `resources_rc.py` setelah edit `.qrc`.
  Mitigasi: dokumentasikan command regenerate secara eksplisit di panduan.