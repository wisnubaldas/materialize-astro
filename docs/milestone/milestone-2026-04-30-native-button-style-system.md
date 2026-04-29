# Milestone Analysis - Reusable Button Styling (Native PySide6)

## Tanggal
2026-04-30

## Kondisi Codebase Saat Ini
- Desktop app sudah memakai style native Qt (`Fusion`) dan belum memiliki sistem style reusable untuk varian tombol.
- Styling button masih default sehingga visual CTA belum konsisten antar screen.

## Gap Analysis (Current vs Target)
- Current: Tidak ada class/variant style tombol yang reusable.
  Target: Ada sistem style berbasis property (`variant`) untuk `primary` dan varian lain.
- Current: Setiap tombol berpotensi distyle manual secara sporadis.
  Target: Semua style lewat helper terpusat + QSS global.

## Rencana Implementasi
1. Tambah file QSS global untuk base button + variant selector.
2. Tambah helper utilitas untuk apply stylesheet app dan set variant tombol.
3. Integrasikan helper pada runtime app startup.
4. Terapkan contoh varian `primary` pada beberapa tombol utama.
5. Update dokumentasi penggunaan style reusable.

## Estimasi Risiko
- Risiko: Style tidak langsung refresh saat property berubah dinamis.
  Mitigasi: helper melakukan `unpolish/polish` widget setelah set property.