# Milestone Analysis - CEISA Circular Import Fix

## Tanggal Analisis
2026-04-28

## Analisis Kondisi Codebase Saat Ini
- Aplikasi gagal start dengan `ImportError` pada inisialisasi modul CEISA.
- Penyebab utama: circular import saat `ceisa_reference_code_repository` mengimpor `app.services.ceisa.reference_model_registry`, sementara `app/services/ceisa/__init__.py` melakukan eager import `sync_job_service` yang kembali mengimpor repository yang sama.

## Gap Analysis (Current vs Target)
- Current:
  - `__init__.py` package CEISA melakukan eager import beberapa submodule.
  - Dependency graph antar module CEISA belum aman dari siklus import.
- Target:
  - Package `app.services.ceisa` tidak memicu eager import yang tidak diperlukan saat module import.
  - Import chain `repository -> services.ceisa.reference_model_registry` berjalan tanpa siklus.

## Rencana Implementasi Bertahap (Milestone)
1. Ubah `app/services/ceisa/__init__.py` menjadi lightweight (tanpa eager import).
2. Pertahankan `__all__` untuk ekspor simbol package.
3. Verifikasi syntax file dan validasi bahwa error runtime tidak lagi berasal dari circular import.

## Estimasi Risiko
- Risiko kompatibilitas jika ada kode yang mengandalkan side effect import dari `app.services.ceisa`.
- Mitigasi:
  - Pertahankan nama simbol pada `__all__`,
  - gunakan import langsung per module (`from app.services.ceisa.x import Y`) pada caller.
