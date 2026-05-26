# 📦 MAU APP - Sistem Manajemen Operasional Gudang Cargo Lini 1

Aplikasi **MAU APP** dikembangkan khusus untuk mengelola operasional gudang cargo lini 1 di Bandara Soekarno-Hatta. Proyek ini mengadopsi arsitektur terdistribusi dengan backend tunggal sebagai *Source of Truth* dan beberapa tipe client frontend resmi (Web, Mobile, Desktop).

## 📋 Daftar Isi

- [Arsitektur & Teknologi](#-arsitektur--teknologi-utama)
- [Struktur Repositori](#-struktur-repositori)
- [Setup & Menjalankan Proyek](#-menjalankan-proyek-di-lingkungan-lokal-development)
- [Deployment Produksi](#-panduan-deployment-ke-produksi)
- [Kebijakan Keamanan](#-kebijakan-keamanan--prinsip-penting)
- [Testing](#-pengujian-testing)
- [Referensi Developer](#-referensi-pengembang--ai-agent)

---

## 🏗️ Arsitektur & Teknologi Utama

Proyek ini dibangun menggunakan teknologi modern yang disesuaikan dengan kebutuhan performa tinggi, stabilitas, dan keamanan:

1. **Backend (Source of Truth):**
   - **FastAPI (Python):** RESTful API, validasi skema via Pydantic, autentikasi JWT, logic bisnis utama, integrasi CEISA/AP2/HUBNET, audit logs, dan background jobs.
   - **Database (Multi-DB System):** Menggunakan SQLAlchemy untuk pemisahan data transaksional dan SSoT operasional.
   - **Celery & Redis:** Pengelolaan antrean tugas (task queue) dan *background jobs*.
   - **ELK Stack (Elasticsearch, Logstash, Kibana) + Filebeat:** Centralized logging untuk monitoring performa dan debugging sistem.

2. **Web Frontend:**
   - **Astro + React (JavaScript):** Digunakan untuk portal utama operasional dengan fitur Server-Side Rendering (SSR) untuk efisiensi loading, didukung styling Materialize UI.

3. **Mobile App:**
   - **React Native + Expo (JavaScript):** Untuk petugas lapangan (gudang), dilengkapi fitur pemindaian barcode/QR secara native via `expo-camera` untuk proses *build-up cargo*.

4. **Desktop App:**
   - **C# WPF (.NET 8):** Dirancang khusus untuk client PC lokal yang membutuhkan performa responsif, menggunakan MVVM pattern dan library *WPF UI*.

---

## 📁 Struktur Repositori

Beberapa komponen utama dalam repositori ini meliputi:

* **CI/CD Pipeline:** [.gitlab-ci.yml](.gitlab-ci.yml)
* **Panduan AI Agent:** [AGENTS.md](AGENTS.md)
* **Scripts Deployment:** 
  * [deploy-development.sh](deploy-development.sh) (Server Development)
  * [deploy-production.sh](deploy-production.sh) (Server Production)
* **Aplikasi Web Frontend:** [astro/](astro) (Lihat panduan spesifik di [astro/README.md](astro/README.md) & [astro/frontend_agent.md](astro/frontend_agent.md))
* **Aplikasi Backend FastAPI:** [materialize-fastapi/](materialize-fastapi) (Lihat panduan spesifik di [materialize-fastapi/README.md](materialize-fastapi/README.md) & [materialize-fastapi/backend_agent.md](materialize-fastapi/backend_agent.md))
* **Aplikasi Desktop Client:** [desktop-app/](desktop-app) (Lihat panduan spesifik di [desktop-app/README.md](desktop-app/README.md) & [desktop-app/desktop_agent.md](desktop-app/desktop_agent.md))
* **Aplikasi Mobile Client:** [mobile-app/](mobile-app) (Lihat panduan spesifik di [mobile-app/README.md](mobile-app/README.md) & [mobile-app/mobile_agent.md](mobile-app/mobile_agent.md))
* **Dokumentasi & Aset Docker:** [docs/](docs), [docker-asset/](docker-asset), dan [email-template/](email-template)

---

## 🚦 Menjalankan Proyek di Lingkungan Lokal (Development)

Setiap komponen dirancang agar dapat dijalankan secara mandiri di mesin lokal Anda.

### 1. Menjalankan Backend (FastAPI)
1. Pastikan Anda menggunakan Python 3.10+ dan [Poetry](https://python-poetry.org/) terpasang.
2. Buka folder backend:
   ```bash
   cd materialize-fastapi
   ```
3. Aktifkan virtual environment:
   ```bash
   poetry shell
   ```
4. Pasang dependencies:
   ```bash
   poetry install
   ```
5. Buat berkas konfigurasi `.env` (salin dari `.env.example`) dan lengkapi variabel database serta kunci JWT.
6. Jalankan API server dalam mode development:
   ```bash
   poetry run dev
   ```
   *Dokumentasi Swagger API interaktif dapat diakses pada `http://127.0.0.1:8000/docs`.*
7. *(Opsional)* Jalankan Celery worker (pada terminal terpisah):
   ```bash
   celery -A app.celery_app.celery_app worker -l info --pool=solo
   ```
8. *(Opsional)* Jalankan database seeder:
   ```bash
   python -m app.db.seeder
   ```

### 2. Menjalankan Web Frontend (Astro)
1. Buka folder frontend:
   ```bash
   cd astro
   ```
2. Pasang dependencies:
   ```bash
   npm install
   ```
3. Siapkan file `.env` (salin dari `.env.example`) dan arahkan API path ke backend lokal:
   ```bash
   PUBLIC_BACKEND_PATH=http://127.0.0.1:8000
   PUBLIC_AUTH_API_BASE_URL=http://127.0.0.1:8000
   ```
4. Jalankan dev server:
   ```bash
   npm run dev
   ```
   *Aplikasi web berjalan di `http://localhost:4321`.*

### 3. Menjalankan Mobile App (Expo)
1. Buka folder mobile-app:
   ```bash
   cd mobile-app
   ```
2. Pasang dependencies:
   ```bash
   npm install
   ```
3. Buat file `.env` dari `.env.example`. Jika Anda menguji di HP fisik (menggunakan Expo Go), gunakan IP LAN komputer Anda sebagai base URL:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://<IP_LAN_KOMPUTER>:8000
   EXPO_PUBLIC_USE_MOCK_AUTH=false
   ```
4. Mulai Expo server:
   ```bash
   npm start
   ```
5. Scan QR code yang muncul di terminal menggunakan aplikasi Expo Go pada perangkat Android/iOS Anda.

### 4. Menjalankan Desktop App (WPF)
1. Pastikan Anda memiliki .NET SDK 8 terpasang.
2. Buka berkas [Mau.Desktop.sln](desktop-app/Mau.Desktop.sln) dengan Visual Studio 2022.
3. Set startup project ke `Mau.Desktop` dan jalankan Debugging, atau via terminal:
   ```powershell
   dotnet run --project desktop-app/src/Mau.Desktop/Mau.Desktop.csproj
   ```

---

## 🚀 Panduan Deployment ke Produksi

Deployment ke server target dikelola menggunakan shell scripts berbasis process manager **Supervisor**.

### Manajemen Branch
* **Development Server:** Menggunakan branch `master` melalui script [deploy-development.sh](deploy-development.sh).
* **Production Server:** Menggunakan branch `production` melalui script [deploy-production.sh](deploy-production.sh).

### Cara Melakukan Deploy di Server
1. Masuk ke server via SSH dan navigasi ke root direktori proyek (`/home/wisnu/mau-app`).
2. Jalankan script deployment sesuai target environment:
   * **Development:**
     ```bash
     ./deploy-development.sh
     ```
   * **Production:**
     ```bash
     ./deploy-production.sh
     ```
   *(Script ini secara otomatis melakukan git fetch & hard reset ke branch tujuan, mem-build Astro SSR frontend, memperbarui dependensi Poetry python, menginstal system dependencies yang dibutuhkan oleh generator PDF seperti `libcairo2`, dan me-restart program backend, scheduler, serta frontend di Supervisor).*

### Deployment Alternatif via Portainer (Docker Stack)
1. Pastikan docker image pendukung dan konfigurasi compose sudah didorong ke repositori GitLab.
2. Masuk ke **Portainer** → **Stacks** → **Add stack**.
3. Pilih opsi **Git repository**, masukkan URL repository, dan atur path-nya ke `docker-asset/docker-compose.yml`.
4. Klik **Deploy the stack**.

---

## 🔒 Kebijakan Keamanan & Prinsip Penting

### 1. Sistem Multi-Database (Single Source of Truth)
Sistem ini membagi hak akses database secara ketat demi integritas data operasional:

| Database | Koneksi | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| **DB1** | `get_db1_r` / `get_db1_w` | **READ + WRITE** | Database utama MAU APP (dapat melakukan INSERT/UPDATE/DELETE). |
| **DB2** | `get_db2_r` | **READ-ONLY** | SSoT data operasional legacy bandara. Hanya boleh dibaca. |
| **DB3** | `get_db3_r` | **READ-ONLY** | SSoT data operasional eksternal. Hanya boleh dibaca. |
| **DB4** | `get_db4_r` | **READ-ONLY** | SSoT data operasional eksternal lainnya. Hanya boleh dibaca. |

> [!CAUTION]
> Jangan pernah melakukan operasi `INSERT`, `UPDATE`, `DELETE`, atau menggunakan session write engine (`get_db2_w`, `get_db3_w`, `get_db4_w`) pada database DB2, DB3, dan DB4. Simpan semua data olahan atau cache ke **DB1**.

### 2. Standar Penerbitan PDF & Cetak Dokumen
* Seluruh cetakan dokumen resmi (seperti Manifest Cargo dan Buildup Checklist) **wajib di-generate server-side** oleh backend FastAPI menggunakan library seperti `xhtml2pdf` atau `weasyprint`.
* Tampilan dokumen cetak menggunakan format layout **Paper CSS** berbasis A4.
* Halaman print dibuka di tab baru dengan menyematkan token JWT sebagai query parameter `/pdf/...?token=...` yang kemudian divalidasi manual di backend.

---

## 🧪 Pengujian (Testing)

Gunakan framework `pytest` pada virtual environment backend untuk memverifikasi fitur:

```bash
# Jalankan seluruh test
pytest

# Jalankan test dengan detail logging output
pytest -s

# Jalankan file test tertentu
pytest tests/test_invoice.py
```

---

## 📖 Referensi Pengembang & AI Agent
Sebelum mengubah file apa pun, pastikan Anda membaca file petunjuk spesifik agent yang sesuai:
* **Root Instruction:** [AGENTS.md](AGENTS.md)
* **Backend Agent:** [materialize-fastapi/backend_agent.md](materialize-fastapi/backend_agent.md)
* **Web Frontend Agent:** [astro/frontend_agent.md](astro/frontend_agent.md)
* **Desktop Agent:** [desktop-app/desktop_agent.md](desktop-app/desktop_agent.md)
* **Mobile Agent:** [mobile-app/mobile_agent.md](mobile-app/mobile_agent.md)
