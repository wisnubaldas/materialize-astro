# Milestone Analysis - Barcode Scanner Initial Setup

## Tanggal
2026-04-29

## Kondisi Codebase Saat Ini
- Direktori `barcode-scanner/` sudah tersedia tetapi belum memiliki source code.
- Belum ada aplikasi desktop scanner berbasis PyQt6 di repository.
- Belum ada mekanisme log scan barcode, validasi barcode terdaftar, dan pengamanan input cepat dari device USB HID.

## Gap Analysis (Current vs Target)
- Current: Tidak ada UI scanner.
  Target: UI PyQt6 dengan satu input barcode dan daftar log scan.
- Current: Tidak ada mekanisme finalisasi scan.
  Target: Enter (ASCII 13) digunakan sebagai pemisah akhir satu barcode.
- Current: Tidak ada validasi barcode.
  Target: Simulasi database dictionary untuk cek barcode terdaftar/tidak.
- Current: Tidak ada perlindungan terhadap input burst.
  Target: Penanganan event keyboard langsung dengan buffer internal agar karakter tidak tertinggal.

## Rencana Implementasi Bertahap
1. Membuat struktur project baru `barcode-scanner` (entrypoint, dependency, dokumentasi penggunaan).
2. Implementasi UI utama PyQt6 dengan `QLineEdit` yang selalu siap menerima input scanner.
3. Menambahkan event filter untuk menangkap input scanner secara cepat dan trigger proses saat Enter.
4. Menambahkan simulasi database dictionary serta log hasil validasi ke UI.
5. Menambahkan mekanisme auto-refocus agar field tetap aktif saat operasional.
6. Verifikasi manual dan dokumentasi teknis implementasi.

## Estimasi Risiko
- Fokus input berpindah ke komponen lain saat user berinteraksi.
  Mitigasi: Auto-focus periodik dengan `QTimer`.
- Input scanner sangat cepat menyebabkan potensi karakter hilang.
  Mitigasi: Pemrosesan ringkas di event filter, buffer internal terpisah, dan pembaruan UI minimal.
- Dependency PyQt6 belum tersedia di environment.
  Mitigasi: Menyediakan `requirements.txt` dan langkah instalasi jelas.
