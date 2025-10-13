# Migration Plan

1. Audit sistem lama (controller, model, helper, DB schema).
2. Buat API Gateway FastAPI modular.
3. Migrasi database per modul.
4. Ganti integrasi direct DB dengan API internal.
5. Buat frontend Astro.
6. Pasang observability (log + monitoring).
7. Testing dan rollout bertahap.