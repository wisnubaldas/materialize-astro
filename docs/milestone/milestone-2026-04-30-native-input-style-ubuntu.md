# Milestone Analysis - Native Input Styling and Ubuntu Font

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Sudah ada sistem varian tombol reusable (`primary/danger/ghost`) berbasis QSS.
- Input form masih style default Qt sehingga belum konsisten dengan tombol.
- Font global Ubuntu belum diterapkan sebagai baseline aplikasi.

## Gap Analysis (Current vs Target)
- Current: Style input belum terstandarisasi dan ukuran masih kecil.
  Target: Style input reusable dengan ukuran lebih besar untuk operasional desktop.
- Current: Font belum dikunci ke Ubuntu secara global.
  Target: Font UI menggunakan Ubuntu secara konsisten.

## Rencana Implementasi
1. Tambahkan style global input field di `app/resources/styles/app.qss`.
2. Perbesar `min-height` dan padding input.
3. Terapkan font Ubuntu secara global via QSS + fallback setFont di runtime.
4. Verifikasi compile + unit test.

## Estimasi Risiko
- Risiko: jika font Ubuntu tidak tersedia di OS tertentu, fallback ke default font Qt.
  Mitigasi: set font via `QFont("Ubuntu")`; Qt akan fallback otomatis bila tidak tersedia.