# TPSOnline Modernization Project

## 🎯 Purpose

Migrasi sistem **TPSOnline (CodeIgniter 3)** menjadi arsitektur modern **FastAPI + Astro** untuk meningkatkan skalabilitas, keamanan, dan integrasi antar sistem internal & eksternal.

## 🧱 Goals

- Menghapus dependensi _direct DB access_ antar sistem internal.
- Menerapkan API Gateway untuk integrasi internal & eksternal.
- Menambahkan autentikasi modern (JWT, cookie domain, RBAC).
- Meningkatkan observabilitas melalui log dan monitoring terpusat (ELK + Grafana).

## 🧩 Target Stack

| Layer            | Teknologi                           | Catatan                        |
| ---------------- | ----------------------------------- | ------------------------------ |
| Frontend         | Astro + Vue 3                       | CSR untuk dashboard interaktif |
| Backend          | FastAPI + Celery                    | Async REST API & task queue    |
| Database         | MySQL (multi-schema)                | Dengan ORM SQLAlchemy 2.0      |
| Caching & Broker | Redis                               | Untuk Celery & SSE             |
| Logging          | Filebeat → Logstash → Elasticsearch | Log pipeline                   |
| Monitoring       | Prometheus + Grafana                | Health & metrics               |
| Deployment       | Docker + Supervisor                 | VM & container support         |
