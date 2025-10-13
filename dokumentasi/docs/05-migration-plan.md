---

### **05-migration-plan.md**

```markdown
# Migration Plan

## Tahap 1 — Audit & Dokumentasi Sistem Lama

- Mapping semua controller, model, view CI3.
- Catat semua query ke database internal dan eksternal.
- Identifikasi endpoint API eksternal (TPS Kemenhub, BeaCukai, AP2, dll).

## Tahap 2 — Design Arsitektur Baru

- Tentukan domain service utama (Auth, Cargo, Invoice, Report).
- Desain ulang struktur database agar modular.
- Siapkan ERD baru dan perbandingan struktur.

## Tahap 3 — Pembuatan API Internal (FastAPI)

- Buat service per domain (`/services/auth_service.py`, dsb).
- Implementasi JWT Auth, CRUD, dan API Gateway.
- Jalankan integrasi bertahap dengan service lama via API bridge.

## Tahap 4 — Pembuatan Frontend Baru (Astro)

- Migrasi dashboard utama.
- Gunakan REST API dari FastAPI.
- Terapkan sistem login via cookie JWT domain `.mitraadira.com`.

## Tahap 5 — Integrasi, Uji, dan Monitoring

- Gunakan staging environment untuk testing integrasi antar API.
- Implementasikan Filebeat + Logstash untuk observasi log.
- Deploy dengan Docker + Supervisor di VM produksi.

## Tahap 6 — Rollout Bertahap

- Gunakan pendekatan _blue-green deployment_.
- Jalankan paralel CI3 & FastAPI minimal 1 bulan.
- Catat bug, optimize performance, baru switch penuh.
```
