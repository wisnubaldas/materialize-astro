# Milestone CEISA Circular Import Hotfix (2026-04-28)

## Tanggal
2026-04-28

## Analisis Kondisi
- Circular import muncul saat `ceisa_reference_code_repository` mengimpor `app.integrations.ceisa.reference_model_registry`.
- Python mengeksekusi `app.integrations.ceisa.__init__` terlebih dulu, sementara file ini melakukan eager import `sync_job` yang kembali mengimpor repository yang sama.

## Gap Analysis
- Sekarang (sebelum fix): package init melakukan eager import semua submodule CEISA.
- Target: package init tidak men-trigger submodule yang tidak diperlukan saat boot import chain.

## Implementasi
- Mengubah `app/integrations/ceisa/__init__.py` menjadi lazy import (`__getattr__`) dengan mapping atribut -> path module.

## Risiko
- Risiko rendah: perubahan perilaku import package-level pada runtime.

## Mitigasi
- Compile check file terkait dan validasi chain import secara minimal.
