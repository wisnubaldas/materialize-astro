# Milestone Analysis - CEISA Env Alignment

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Implementasi OAuth CEISA terbaru membutuhkan variabel `CEISA_USERNAME`, `CEISA_PASSWORD`, dan `CEISA_REFRESH_URL`.
- File `materialize-fastapi/.env` sebelumnya hanya berisi `CEISA_CLIENT_ID` dan `CEISA_CLIENT_SECRET` tanpa key user/password eksplisit.

## Gap Analysis (Current vs Target)
- Current:
  - Key env untuk user/password CEISA belum ada.
  - Refresh URL OAuth CEISA belum didefinisikan.
- Target:
  - Key env CEISA lengkap untuk flow login + refresh token.
  - Nilai kredensial existing tetap dipertahankan tanpa rotasi value.

## Rencana Implementasi Bertahap (Milestone)
1. Tambah key `CEISA_USERNAME` dengan nilai dari `CEISA_CLIENT_ID`.
2. Tambah key `CEISA_PASSWORD` dengan nilai dari `CEISA_CLIENT_SECRET`.
3. Tambah key `CEISA_REFRESH_URL` default dari `CEISA_BASE_URL`.
4. Verifikasi daftar key CEISA pada `.env` setelah update.

## Estimasi Risiko
- Risiko mismatch jika credential CEISA aktif ternyata berbeda dari nilai `CEISA_CLIENT_ID/CEISA_CLIENT_SECRET`.
- Mitigasi:
  - tetap pertahankan key lama untuk backward compatibility,
  - lakukan pengecekan login CEISA pada environment runtime.
