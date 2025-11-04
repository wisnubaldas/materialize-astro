# Materialize Astro Project

Panduan ringkas untuk menyiapkan, mengelola, dan mempelajari proyek **materialize-astro**.

## Daftar Isi

- [Materialize Astro Project](#materialize-astro-project)
  - [Daftar Isi](#daftar-isi)
  - [Deploy di Portainer](#deploy-di-portainer)
  - [Dependensi Frontend](#dependensi-frontend)
    - [Datatables React + Bootstrap5](#datatables-react--bootstrap5)
    - [Javascript loader](#javascript-loader)
    - [CSS includes](#css-includes)
    - [Sample](#sample)
  - [Celery \& Logging](#celery--logging)
  - [ELK Stack](#elk-stack)
  - [Panduan Pengujian](#panduan-pengujian)
  - [Sumber Ikon](#sumber-ikon)
  - [Mengelola Remote Git](#mengelola-remote-git)

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

## Dependensi Frontend

Datatables menggunakan react datatables contoh [tictactoe](https://stackblitz.com/edit/datatables-net-react-components?file=src%2FApp.tsx,src%2FApp.css&terminal=dev):

### Datatables React + Bootstrap5

```shell
npm install jszip
npm install pdfmake
npm install datatables.net-react
npm install datatables.net-bs5
npm install datatables.net-autofill-bs5
npm install datatables.net-buttons-bs5
npm install datatables.net-colreorder-bs5
npm install datatables.net-columncontrol-bs5
npm install datatables.net-datetime
npm install datatables.net-fixedcolumns-bs5
npm install datatables.net-fixedheader-bs5
npm install datatables.net-keytable-bs5
npm install datatables.net-responsive-bs5
npm install datatables.net-rowgroup-bs5
npm install datatables.net-rowreorder-bs5
npm install datatables.net-scroller-bs5
npm install datatables.net-searchbuilder-bs5
npm install datatables.net-searchpanes-bs5
npm install datatables.net-select-bs5
npm install datatables.net-staterestore-bs5
```

### Javascript loader

```js
import jszip from "jszip";
import pdfmake from "pdfmake";
import DataTable from "datatables.net-react";
import DataTablesCore from "datatables.net-bs5";
import "datatables.net-autofill-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.colVis.mjs";
import "datatables.net-buttons/js/buttons.html5.mjs";
import "datatables.net-buttons/js/buttons.print.mjs";
import "datatables.net-colreorder-bs5";
import "datatables.net-columncontrol-bs5";
import DateTime from "datatables.net-datetime";
import "datatables.net-fixedcolumns-bs5";
import "datatables.net-fixedheader-bs5";
import "datatables.net-keytable-bs5";
import "datatables.net-responsive-bs5";
import "datatables.net-rowgroup-bs5";
import "datatables.net-rowreorder-bs5";
import "datatables.net-scroller-bs5";
import "datatables.net-searchbuilder-bs5";
import "datatables.net-searchpanes-bs5";
import "datatables.net-select-bs5";
import "datatables.net-staterestore-bs5";

DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);
DataTable.use(DataTablesCore);
```

### CSS includes

```scss
@import url("datatables.net-bs5");
@import url("datatables.net-autofill-bs5");
@import url("datatables.net-buttons-bs5");
@import url("datatables.net-colreorder-bs5");
@import url("datatables.net-columncontrol-bs5");
@import url("datatables.net-fixedcolumns-bs5");
@import url("datatables.net-fixedheader-bs5");
@import url("datatables.net-keytable-bs5");
@import url("datatables.net-responsive-bs5");
@import url("datatables.net-rowgroup-bs5");
@import url("datatables.net-rowreorder-bs5");
@import url("datatables.net-scroller-bs5");
@import url("datatables.net-searchbuilder-bs5");
@import url("datatables.net-searchpanes-bs5");
@import url("datatables.net-select-bs5");
@import url("datatables.net-staterestore-bs5");
```

### Sample

[https://stackblitz.com/edit/q4eyhdea-kwamzrpm?file=src%2FApp.tsx](https://stackblitz.com/edit/q4eyhdea-kwamzrpm?file=src%2FApp.tsx)
[https://q4eyhdea-kwamzrpm.stackblitz.io](https://q4eyhdea-kwamzrpm.stackblitz.io)

## Celery & Logging

Referensi diskusi: <https://chatgpt.com/share/68c3a2e1-8248-8013-b35d-6005f9a0af1d>

## ELK Stack

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

## Baca Socket PC

> [Diskusi terkait soket pc ada disini](https://chatgpt.com/share/69081225-145c-8013-b834-002f2e8a908b)
