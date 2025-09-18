## Deploy di Portainer

- Push backend/Dockerfile, frontend/Dockerfile, dan docker-compose.yml ke repo GitLab.
- Di Portainer → Stacks → Add stack → pilih dari Git → masukkan repo GitLab kamu.
- Pastikan path docker-compose.yml benar (/docker-compose.yml).
- Deploy.

## Root path:

c:\Users\wisnu\Documents\Belajar\materialize-project

## Content

```bash
C:/Users/wisnu/Documents/Belajar/materialize-project/
├─.git/
├─.vscode/
├─html-version/
├─materialize-astro/
├─materialize-fastapi/
│　├─__pycache__/
│　├─.venv/
│　├─app/
│　├─migrations/
│　├─.gitignore
│　├─.pylintrc
│　├─alembic.ini
│　├─docker-compose.yml
│　├─Dockerfile
│　├─poetry.lock
│　├─pyproject.toml
│　├─README.md
│　└─test.py
└─.tree
```

```bash
# DataTables core
npm install datatables.net-bs5

# AutoFill
npm install datatables.net-autofill-bs5

# Buttons
npm install datatables.net-buttons-bs5

# ColReorder
npm install datatables.net-colreorder-bs5

# ColumnControl
npm install datatables.net-columncontrol-bs5

# FixedColumns
npm install datatables.net-fixedcolumns-bs5

# FixedHeader
npm install datatables.net-fixedheader-bs5

# KeyTable
npm install datatables.net-keytable-bs5

# RowGroup
npm install datatables.net-rowgroup-bs5

# RowReorder
npm install datatables.net-rowreorder-bs5

# Responsive
npm install datatables.net-responsive-bs5

# Scroller
npm install datatables.net-scroller-bs5

# SearchBuilder
npm install datatables.net-searchbuilder-bs5

# SearchPanes
npm install datatables.net-searchpanes-bs5

# Select
npm install datatables.net-select-bs5

# StateRestore
npm install datatables.net-staterestore-bs5
```

# SESIION BELAJAR

### seputar celery dan log

`https://chatgpt.com/share/68c3a2e1-8248-8013-b35d-6005f9a0af1d`

### ELK

1. Akses Services

```bash
Elasticsearch → http://SERVER_IP:9200

Kibana → http://SERVER_IP:5601

Logstash listen di :5000 (TCP/JSON logs)
```

### pytest

```bash
# opsi -s untuk menampilkan data
pytest -s
# Jalankan 1 file test
pytest tests/test_invoice.py
# Jalankan 1 function test dalam file
pytest tests/test_invoice.py::test_insert_invoice
# Jalankan 1 class test dalam file
pytest tests/test_invoice.py::TestInvoiceCRUD
# Tambahkan opsi verbose Biar lebih jelas hasil testnya:
pytest -v tests/test_invoice.py
```

# icon set pake ini

`https://iconify.design/`

## 1 project 2 remote

```bash
PS C:\Users\wisnu\Documents\Belajar\materialize-project> git remote -v
origin  git@gitlab.com:wisnubaldas/materialize-astro.git (fetch)
origin  git@gitlab.com:wisnubaldas/materialize-astro.git (push)
PS C:\Users\wisnu\Documents\Belajar\materialize-project> git remote add office git@gitlab.att.id:mau/mau-app.git
PS C:\Users\wisnu\Documents\Belajar\materialize-project> git remote -v
office  git@gitlab.att.id:mau/mau-app.git (fetch)
office  git@gitlab.att.id:mau/mau-app.git (push)
origin  git@gitlab.com:wisnubaldas/materialize-astro.git (fetch)
origin  git@gitlab.com:wisnubaldas/materialize-astro.git (push)
```
