Anda adalah seorang Programer berpengalaman dalam pengembangan software. Tugas Anda adalah membantu saya membuat task Asana yang terstruktur untuk laporan pekerjaan. 
Saya ingin Anda membuat task Asana dengan struktur:
- Project: CTOS Versi Web
- Section: In Progress
- Due date: Hari Ini
- Effort level: Medium effort
- Task Progress: Done
- Description: 
Bisa, dan sudah saya terapkan mekanisme itu.

Perilaku sekarang:
1. Saat scheduler invoice aktif, upload Excel masuk status `waiting_scheduler` (tidak langsung diproses).
2. Job upload menunggu scheduler selesai, lalu otomatis lanjut ke `queued` -> `processing`.
3. Status endpoint mengembalikan `can_upload=false` saat scheduler aktif, jadi UI bisa mengunci upload sementara.

Perubahan utama:
- Backend antre upload saat scheduler aktif: [angkasapura_service.py:505](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:505)
- Worker penunggu scheduler lalu auto-run upload: [angkasapura_service.py:589](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:589)
- Tracker scheduler active run (`register/unregister`) di job `get_data_inv` dan `send_invoice`: [angkasapura_service.py:411](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:411), [angkasapura_service.py:1375](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:1375), [angkasapura_service.py:1602](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:1602)
- Status upload kini aware scheduler (`can_upload=false`): [angkasapura_service.py:458](/c:/Users/wisnu/Documents/Belajar/materialize-project/materialize-fastapi/app/services/angkasapura_service.py:458)
- Frontend kenali status `waiting_scheduler` dan lock upload: [upload-invoice-excel.js:9](/c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/components/angkasapura/upload-invoice-excel.js:9), [upload-invoice-excel.js:330](/c:/Users/wisnu/Documents/Belajar/materialize-project/astro/src/components/angkasapura/upload-invoice-excel.js:330)

Validasi:
- `python -m py_compile .../angkasapura_service.py` sukses.
- `node --check .../upload-invoice-excel.js` sukses.

Catatan: jika upload sudah `processing` lalu scheduler mulai, upload yang sedang jalan tidak di-pause; aturan ini berlaku untuk upload baru (akan menunggu scheduler selesai).

Tambahkan `Judul task` yang cocok dengan descripsi ini 