# API Reference

Berikut daftar endpoint yang tersedia berdasarkan spesifikasi OpenAPI.

| Method | Path | Summary | Tags |
|--------|------|----------|------|
| `POST` | `/auth/login` | Login | Auth |
| `GET` | `/auth/verify` | Verify | Auth |
| `POST` | `/angkasapura/datatables` | Angkasapura | Angkasapura |
| `POST` | `/angkasapura/get-data-response-inv` | Get Data Response Inv | Angkasapura |
| `POST` | `/angkasapura/data-inv-yang-tidak-lengkap` | Data Inv Yang Tidak Lengkap | Angkasapura |
| `POST` | `/angkasapura/void-invoice` | Void Invoice | Angkasapura |
| `POST` | `/angkasapura/get-void-invoice` | Get Void Invoice | Angkasapura |
| `POST` | `/hubnet/data-terkirim` | Data Terkirim | Hubnet |
| `POST` | `/hubnet/upload-manifests` | Upload Manifests | Hubnet |
| `GET` | `/hubnet/dashboard-card` | Ini untuk card di dashboard | Hubnet |
| `GET` | `/hubnet/last-sending` | Data terakhir terkirim ke HUBNET | Hubnet |
| `GET` | `/hubnet/get-data-terkirim/` | megecek data terkirim dari API HUBNET | Hubnet |
| `POST` | `/hubnet/delete-data-terkirim` | Delete data terkirim di API HUBNET | Hubnet |
| `GET` | `/sse/sending-ke-hubnet` | Stream Sending Ke Hubnet | Routing untuk SSE server-sent event |
| `GET` | `/sse/log-send-invoice-ap2` | Log Send Invoice Ap2 | Routing untuk SSE server-sent event |
| `GET` | `/` | Root |  |
