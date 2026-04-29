# Milestone Analysis - Desktop Qt Designer Refactor

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Desktop app sudah berjalan dengan pola MVVM, namun layout `LoginView` dan `MainWindow` masih hardcoded di Python.
- Sudah ada stabilisasi worker thread login, tetapi maintainability UI rendah karena perubahan layout harus edit kode.
- Belum ada folder `.ui` untuk integrasi Qt Designer.

## Gap Analysis (Current vs Target)
- Current: Layout dibuat manual via kode widget.
  Target: Layout/frame dibuat di Qt Designer (`.ui`) agar perubahan UI lebih cepat dan aman.
- Current: Tidak ada standar objectName untuk binding UI->ViewModel.
  Target: Object name terstruktur untuk binding signal/state yang konsisten.
- Current: Dokumentasi integrasi Qt Designer belum tersedia.
  Target: Ada panduan workflow desain, binding, dan batasan tanggung jawab View.

## Rencana Implementasi Bertahap
1. Tambahkan folder `desktop-app/app/resources/ui` dan file `login_view.ui`, `main_window.ui`.
2. Buat utility loader `.ui` terpusat untuk menghindari duplikasi load logic.
3. Refactor `LoginView` agar memuat `.ui` dan mempertahankan thread-safe login flow.
4. Refactor `MainWindow` agar memuat `.ui` dan bind menu/stack secara stabil.
5. Tambahkan dokumentasi teknis integrasi Qt Designer pada project desktop.
6. Update `AGENTS.md` agar aturan penggunaan Qt Designer menjadi panduan default task selanjutnya.

## Estimasi Risiko
- Risiko: objectName mismatch antara `.ui` dan kode Python menyebabkan `NoneType` binding error.
  Mitigasi: Tambahkan validasi komponen wajib saat inisialisasi view.
- Risiko: refactor UI mengubah urutan signal sehingga muncul race condition baru.
  Mitigasi: Pertahankan guard thread & signal binding setelah komponen selesai inisialisasi.
- Risiko: merge konflik pada file AGENTS karena sering berubah.
  Mitigasi: Update bagian desktop secara minimal dan terarah.