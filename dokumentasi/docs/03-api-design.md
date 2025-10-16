# API Reference

Berikut tampilan Swagger UI untuk semua endpoint TPSOnline API.

```swagger-ui
url: http://110.239.87.173:8000/openapi.json

```

# API Reference

Berikut daftar endpoint yang tersedia berdasarkan spesifikasi OpenAPI.

| Method | Path                                       | Summary                               | Tags                                |
| ------ | ------------------------------------------ | ------------------------------------- | ----------------------------------- |
| `POST` | `/auth/login`                              | Login                                 | Auth                                |
| `GET`  | `/auth/verify`                             | Verify                                | Auth                                |
| `POST` | `/angkasapura/datatables`                  | Angkasapura                           | Angkasapura                         |
| `POST` | `/angkasapura/get-data-response-inv`       | Get Data Response Inv                 | Angkasapura                         |
| `POST` | `/angkasapura/data-inv-yang-tidak-lengkap` | Data Inv Yang Tidak Lengkap           | Angkasapura                         |
| `POST` | `/angkasapura/void-invoice`                | Void Invoice                          | Angkasapura                         |
| `POST` | `/angkasapura/get-void-invoice`            | Get Void Invoice                      | Angkasapura                         |
| `POST` | `/hubnet/data-terkirim`                    | Data Terkirim                         | Hubnet                              |
| `POST` | `/hubnet/upload-manifests`                 | Upload Manifests                      | Hubnet                              |
| `GET`  | `/hubnet/dashboard-card`                   | Ini untuk card di dashboard           | Hubnet                              |
| `GET`  | `/hubnet/last-sending`                     | Data terakhir terkirim ke HUBNET      | Hubnet                              |
| `GET`  | `/hubnet/get-data-terkirim/`               | megecek data terkirim dari API HUBNET | Hubnet                              |
| `POST` | `/hubnet/delete-data-terkirim`             | Delete data terkirim di API HUBNET    | Hubnet                              |
| `GET`  | `/sse/sending-ke-hubnet`                   | Stream Sending Ke Hubnet              | Routing untuk SSE server-sent event |
| `GET`  | `/sse/log-send-invoice-ap2`                | Log Send Invoice Ap2                  | Routing untuk SSE server-sent event |
| `GET`  | `/`                                        | Root                                  |                                     |

Hasilnya → MkDocs menampilkan _Swagger UI embeded_ langsung di halaman (seperti di FastAPI `/docs`).

---

## ⚙️ Opsi 3 — Generate tabel manual (kalau tidak mau pakai plugin)

Kalau kamu ingin murni _Markdown table_ tanpa plugin (untuk versi offline total), buat script Python kecil untuk mengekstrak paths jadi tabel:

### `generate_api_table.py`

```python
import json

with open("docs/openapi.json", "r", encoding="utf-8") as f:
    spec = json.load(f)

print("| Method | Path | Summary | Tags |")
print("|---------|------|----------|------|")

for path, methods in spec["paths"].items():
    for method, details in methods.items():
        summary = details.get("summary", "")
        tags = ", ".join(details.get("tags", []))
        print(f"| {method.upper()} | `{path}` | {summary} | {tags} |")
```
