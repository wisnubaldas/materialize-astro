# Materialize Astro Project

Panduan ringkas untuk menyiapkan, mengelola, dan mempelajari proyek **materialize-astro**.

## Daftar Isi
1. [Deploy di Portainer](#deploy-di-portainer)
2. [Struktur Proyek](#struktur-proyek)
3. [Dependensi Frontend (DataTables)](#dependensi-frontend-datatables)
4. [Catatan Pembelajaran](#catatan-pembelajaran)
   - [Celery & Logging](#celery--logging)
   - [ELK Stack](#elk-stack)
5. [Panduan Pengujian](#panduan-pengujian)
6. [Sumber Ikon](#sumber-ikon)
7. [Mengelola Remote Git](#mengelola-remote-git)

---

## Deploy di Portainer
1. Pastikan file berikut sudah dipush ke repository GitLab:
   - `backend/Dockerfile`
   - `frontend/Dockerfile`
   - `docker-compose.yml`
2. Buka **Portainer** → **Stacks** → **Add stack**.
3. Pilih opsi **Git repository** dan masukkan URL repository GitLab.
4. Isi path ke `docker-compose.yml` dengan benar (`/docker-compose.yml`).
5. Klik **Deploy the stack**.

---

## Struktur Proyek
Root path lokal: `C:\Users\wisnu\Documents\Belajar\materialize-project`

```
C:/Users/wisnu/Documents/Belajar/materialize-project/
├─ .git/
├─ .vscode/
├─ html-version/
├─ materialize-astro/
├─ materialize-fastapi/
│  ├─ __pycache__/
│  ├─ .venv/
│  ├─ app/
│  ├─ migrations/
│  ├─ .gitignore
│  ├─ .pylintrc
│  ├─ alembic.ini
│  ├─ docker-compose.yml
│  ├─ Dockerfile
│  ├─ poetry.lock
│  ├─ pyproject.toml
│  ├─ README.md
│  └─ test.py
└─ .tree
```

---

## Dependensi Frontend (DataTables)
Install paket DataTables berikut sesuai kebutuhan komponen:

```bash
# Core
npm install datatables.net-bs5

# Add-ons
npm install datatables.net-autofill-bs5
npm install datatables.net-buttons-bs5
npm install datatables.net-colreorder-bs5
npm install datatables.net-columncontrol-bs5
npm install datatables.net-fixedcolumns-bs5
npm install datatables.net-fixedheader-bs5
npm install datatables.net-keytable-bs5
npm install datatables.net-rowgroup-bs5
npm install datatables.net-rowreorder-bs5
npm install datatables.net-responsive-bs5
npm install datatables.net-scroller-bs5
npm install datatables.net-searchbuilder-bs5
npm install datatables.net-searchpanes-bs5
npm install datatables.net-select-bs5
npm install datatables.net-staterestore-bs5
```

---

## Catatan Pembelajaran

### Celery & Logging
Referensi diskusi: <https://chatgpt.com/share/68c3a2e1-8248-8013-b35d-6005f9a0af1d>

### ELK Stack
Akses service yang berjalan:

- **Elasticsearch:** `http://SERVER_IP:9200`
- **Kibana:** `http://SERVER_IP:5601`
- **Logstash:** listen di port `5000` (TCP/JSON logs)

---

## Panduan Pengujian
Gunakan `pytest` dengan opsi berikut sesuai kebutuhan:

```bash
# Menampilkan log selama pengujian
pytest -s

# Menjalankan satu file test
pytest tests/test_invoice.py

# Menjalankan satu function test
pytest tests/test_invoice.py::test_insert_invoice

# Menjalankan satu class test
pytest tests/test_invoice.py::TestInvoiceCRUD

# Menampilkan hasil test yang lebih detail
pytest -v tests/test_invoice.py
```

---

## Sumber Ikon
Gunakan ikon dari: <https://iconify.design/>

---

## Mengelola Remote Git
Contoh konfigurasi satu proyek dengan dua remote:

```bash
# Cek remote saat ini
git remote -v
# Menambahkan remote "office"
git remote add office git@gitlab.att.id:mau/mau-app.git
# Verifikasi remote
git remote -v
```

Remote yang digunakan:
- `origin` → `git@gitlab.com:wisnubaldas/materialize-astro.git`
- `office` → `git@gitlab.att.id:mau/mau-app.git`

