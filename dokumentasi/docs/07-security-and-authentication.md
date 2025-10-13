# Security & Authentication

## 🔐 JWT Access Token

- Token dibuat di backend FastAPI.
- Disimpan di cookie `access_token` (httpOnly, secure).
- Domain cookie: `.mitraadira.com` agar lintas subdomain.

## 🔒 CORS Policy

| Environment | Frontend URL                  | Backend URL                |
| ----------- | ----------------------------- | -------------------------- |
| Development | http://localhost:4321         | http://localhost:8000      |
| Production  | https://portal.mitraadira.com | https://api.mitraadira.com |

## 🧱 Role-based Access Control (RBAC)

- Role disimpan di tabel `user_roles`.
- Middleware `AuthMiddleware` mengecek per route.
