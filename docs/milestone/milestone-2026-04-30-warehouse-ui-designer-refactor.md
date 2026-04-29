# Milestone Analysis - Warehouse Pages Qt Designer Refactor

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- `WeighingView` dan `BuildupView` masih menggunakan layout hardcoded di Python.
- Main shell (`LoginView` dan `MainWindow`) sudah berhasil dimigrasikan ke file `.ui`.
- Belum ada file `.ui` khusus untuk halaman warehouse.

## Gap Analysis (Current vs Target)
- Current: Layout module warehouse belum menggunakan Qt Designer.
  Target: Semua page utama desktop (termasuk warehouse) berbasis `.ui` untuk percepatan iterasi UI.
- Current: Kontrak objectName untuk warehouse page belum terdokumentasi.
  Target: ObjectName warehouse terdokumentasi agar binding stabil saat refactor.

## Rencana Implementasi Bertahap
1. Menambahkan file `.ui` untuk `weighing_view` dan `buildup_view`.
2. Refactor view Python agar memuat `.ui` melalui `ui_loader`.
3. Menambahkan validasi komponen wajib (`objectName`) di masing-masing view.
4. Memperbarui dokumentasi integrasi Qt Designer.
5. Menjalankan verifikasi compile + test.

## Estimasi Risiko
- Risiko: Ketidaksesuaian `objectName` dapat menyebabkan runtime error.
  Mitigasi: Tambahkan fail-fast runtime validation pada komponen wajib.
- Risiko: Placeholder UI belum terhubung ke endpoint warehouse.
  Mitigasi: Pertahankan label status bahwa integrasi API dilakukan bertahap.