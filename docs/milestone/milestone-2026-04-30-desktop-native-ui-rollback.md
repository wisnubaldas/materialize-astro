# Milestone Analysis - Desktop UI Rollback from qt-material to Native PySide6

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Runtime desktop masih bergantung pada `qt-material` (`apply_stylesheet`) dan mengalami crash saat parsing override CSS (`KeyError`).
- Workflow Designer juga ikut tergantung script export/preview `qt-material`.
- Akibatnya stabilitas startup terganggu meski flow API login sudah benar.

## Gap Analysis (Current vs Target)
- Current: UI theme bergantung plugin stylesheet yang rentan error format saat startup.
  Target: Gunakan UI bawaan PySide6 yang stabil dan ringan (native/Fusion), tanpa dependency theme eksternal wajib.
- Current: Ada file/style/script khusus qt-material yang tidak diperlukan bila kembali ke native style.
  Target: Bersihkan file dan dependency yang tidak terpakai.
- Current: AGENTS masih mengunci aturan `qt-material`.
  Target: AGENTS diperbarui agar default desktop style memakai PySide6 native dan plugin hanya opsional.

## Rencana Implementasi Bertahap
1. Hapus pemanggilan `qt-material` dari runtime (`main.py`) dan gunakan `QStyleFactory` built-in.
2. Hapus konfigurasi env `MAU_UI_THEME` dan `MAU_UI_DENSITY_SCALE` yang tidak relevan.
3. Hapus dependency `qt-material` dari `pyproject.toml`.
4. Hapus file/script khusus qt-material (QSS preview/export script).
5. Update README, dokumen Qt Designer integration, dan AGENTS.
6. Verifikasi compile + unit test.

## Estimasi Risiko
- Risiko: Tampilan UI berubah dari style material ke native style.
  Mitigasi: Gunakan `Fusion` style bawaan Qt untuk tampilan lintas platform yang konsisten.
- Risiko: Ada referensi tersisa ke file/script yang dihapus.
  Mitigasi: lakukan pencarian string dan jalankan compile/test penuh.