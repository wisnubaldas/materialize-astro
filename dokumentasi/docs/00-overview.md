# TPSOnline Modernization Project

## 🎯 Purpose
Migrasi sistem **TPSOnline (CodeIgniter 3)** menjadi arsitektur modern **FastAPI + Astro** untuk meningkatkan skalabilitas, keamanan, dan integrasi antar sistem internal & eksternal.

## 🧱 Goals
- Menghapus dependensi *direct DB access* antar sistem internal.
- Menerapkan API Gateway untuk integrasi internal & eksternal.
- Menambahkan autentikasi modern (JWT, cookie domain, RBAC).
- Meningkatkan observabilitas melalui log dan monitoring terpusat (ELK + Grafana).