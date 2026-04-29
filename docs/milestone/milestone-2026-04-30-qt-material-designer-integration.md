# Milestone Analysis - Qt Material Designer Integration Stabilization

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Runtime app sudah memanggil `apply_stylesheet(app, theme='light_blue.xml')`.
- File `.ui` dibuka langsung di Qt Designer tidak otomatis memakai stylesheet runtime aplikasi.
- Saat icon ditambahkan pada `QPushButton` dari Designer, ukuran/padding default bisa membuat komponen terlihat berantakan.

## Gap Analysis (Current vs Target)
- Current: Preview di Designer tidak mencerminkan tampilan qt-material runtime.
  Target: Ada alur preview bertema material untuk file `.ui` selama proses desain.
- Current: Belum ada stylesheet override terpusat untuk stabilisasi button/icon spacing.
  Target: Ada CSS override global agar layout tetap konsisten ketika icon dipasang.
- Current: Dokumentasi untuk workflow designer + material belum lengkap.
  Target: Dokumen langkah pakai preview/export stylesheet tersedia.

## Rencana Implementasi Bertahap
1. Tambah parameter konfigurasi tema qt-material di `AppConfig`.
2. Integrasikan `apply_stylesheet(..., css_file=...)` dengan file override custom.
3. Tambah stylesheet override untuk ukuran minimum input/button dan icon size.
4. Tambah script preview `.ui` dengan qt-material.
5. Tambah script export stylesheet untuk dipakai di Qt Designer.
6. Update README + dokumen Qt Designer integration + AGENTS.

## Estimasi Risiko
- Risiko: style override terlalu agresif mengubah tampilan widget lain.
  Mitigasi: gunakan selector konservatif (`QPushButton`, `QLineEdit`) dengan nilai minimal.
- Risiko: perbedaan render antara Designer dan runtime tetap ada.
  Mitigasi: sediakan preview runner berbasis runtime Qt + qt-material sebagai sumber validasi utama.