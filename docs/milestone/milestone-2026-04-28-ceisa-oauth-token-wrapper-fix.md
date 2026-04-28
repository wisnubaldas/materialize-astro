# Milestone Analysis - CEISA OAuth Token Wrapper Fix

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Endpoint login test OAuth CEISA mengembalikan `502` walaupun request login ke CEISA sukses (`HTTP 200`).
- Payload response CEISA menyimpan token pada wrapper `item.access_token`.
- Parser token di OAuth service sebelumnya hanya membaca token dari:
  - top-level payload,
  - wrapper `data`.

## Gap Analysis (Current vs Target)
- Current:
  - Parser token tidak kompatibel dengan format response CEISA yang menggunakan key `item`.
- Target:
  - Parser token toleran terhadap beberapa wrapper response (`item`, `data`, `result`, dll).
  - Login test OAuth CEISA berhasil selama access token ada di salah satu wrapper yang valid.

## Rencana Implementasi Bertahap (Milestone)
1. Refactor ekstraksi token di `CeisaOAuthService._cache_tokens`.
2. Tambah helper `_extract_token_container` untuk memilih container token yang benar.
3. Verifikasi syntax setelah patch.

## Estimasi Risiko
- Risiko format response CEISA bisa berubah lagi di masa depan.
- Mitigasi:
  - parser dibuat tolerant terhadap wrapper umum (`item`, `data`, `result`, `results`, `body`).
