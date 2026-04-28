# Milestone Analysis - CEISA OAuth 2.0 Authentication

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Modul CEISA sebelumnya menggunakan alur token `client_credentials` langsung di `CeisaClientService`.
- Dokumen CEISA terbaru menekankan alur OAuth 2.0 host-to-host menggunakan endpoint login (`/nle-oauth/v1/user/login`) dan refresh token (`/nle-oauth/v1/user/update-token`).
- Header request outbound CEISA belum sepenuhnya menyesuaikan contoh dokumentasi (`Beacukai-Api-Key`, `nle-api-key`, `Authorization: Bearer ...`).
- Logging request/response CEISA sudah memiliki tabel (`ceisa_request_log`) tetapi belum diintegrasikan pada flow autentikasi + HTTP client CEISA.

## Gap Analysis (Current vs Target)
- Current:
  - Belum ada service OAuth CEISA terpisah/reusable (login + refresh + cache token).
  - Integrasi auth masih tercampur di HTTP client.
  - Audit log outbound CEISA belum konsisten dipakai untuk auth dan API call.
- Target:
  - Ada `CeisaOAuthService` reusable untuk autentikasi CEISA.
  - `CeisaClientService` menggunakan OAuth service tersebut dan mengelola invalidasi token.
  - Request auth/API outbound tercatat ke `ceisa_request_log`.

## Rencana Implementasi Bertahap (Milestone)
1. Tambah konfigurasi env untuk OAuth CEISA berbasis username/password + refresh URL.
2. Tambah service `CeisaOAuthService`:
   - login token,
   - refresh token,
   - cache access token in-memory,
   - fallback ke login saat refresh gagal.
3. Refactor `CeisaClientService`:
   - gunakan `CeisaOAuthService`,
   - set header standar CEISA,
   - log request/response outbound.
4. Extend `CeisaLogRepository` untuk operasi `ceisa_request_log`.
5. Integrasikan dependency injection CEISA client agar membawa `CeisaLogRepository`.
6. Verifikasi syntax/import.

## Estimasi Risiko
- Risiko ketidaksesuaian format response token CEISA antar endpoint.
- Risiko endpoint refresh membutuhkan format header spesifik pada environment tertentu.
- Mitigasi:
  - parser token dibuat tolerant untuk beberapa nama field (`access_token`/`accessToken`),
  - fallback login ulang jika refresh gagal,
  - logging error detail pada `ceisa_request_log` untuk observabilitas.
