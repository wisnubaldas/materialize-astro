# Weekly Report Generator Gemini

Script ini menggenerate laporan mingguan MAU APP / CTOS dari file harian di `docs/report-progress/` menggunakan Gemini API.

## Acuan

- Sumber progress: `docs/report-progress/`
- Aturan format email: `docs/prompt-report-mingguan.md`
- Output default: `docs/report-mingguan/`
- API AI: [Gemini API generateContent](https://ai.google.dev/api)

## Setup

Script memakai Python standard library, jadi tidak perlu install package tambahan.

Set API key Gemini di environment variable atau file `.env` lokal pada folder generator. Jangan commit API key ke repo.

```powershell
$env:GEMINI_API_KEY="ISI_API_KEY_GEMINI"
```

Atau isi file `docs\weekly-report-generator\.env`:

```env
GEMINI_API_KEY=ISI_API_KEY_GEMINI
GEMINI_AUTO_MODEL_FALLBACK=true
GEMINI_FALLBACK_MODELS=gemini-2.5-flash,gemini-2.0-flash
GEMINI_MODEL_RETRY_DELAY=5
```

## Cara Pakai

Generate report untuk periode tertentu:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --start 2026-05-25 --end 2026-05-31
```

Generate otomatis untuk 7 hari terakhir berdasarkan tanggal progress terbaru:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py
```

Gunakan model lain jika diperlukan:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --start 2026-05-25 --end 2026-05-31 --model gemini-2.5-flash
```

Gunakan model cadangan jika model utama terkena rate limit atau error transient:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --model gemini-flash-latest --fallback-models gemini-2.5-flash,gemini-2.0-flash
```

Secara default, jika model utama dan fallback statis terkena rate limit/error transient, script akan mengambil daftar semua model dari endpoint `https://generativelanguage.googleapis.com/v1beta/models`, memfilter model yang mendukung `generateContent`, lalu mencoba model tersebut satu per satu.

Matikan fallback dinamis jika ingin hanya memakai daftar model statis:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --no-auto-model-fallback
```

Atur jeda antar percobaan fallback model:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --model-retry-delay 10
```

Cek prompt tanpa memanggil API:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --start 2026-05-25 --end 2026-05-31 --dry-run
```

Jika command terlihat terlalu lama, batasi periode atau naikkan timeout:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --days 7 --timeout 300
```

Secara default script tidak mengirim batas `maxOutputTokens`, supaya output tidak dipotong oleh konfigurasi lokal. Jika ingin membatasi panjang output secara eksplisit, gunakan:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --days 7 --max-output-tokens 8192
```

## Kirim ke Email Outlook / Microsoft 365

Isi konfigurasi SMTP di `docs\weekly-report-generator\.env`:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USE_STARTTLS=true
SMTP_USERNAME=email@domain.com
SMTP_PASSWORD=PASSWORD_ATAU_APP_PASSWORD
SMTP_FROM=email@domain.com
SMTP_TO=manager@domain.com;supervisor@domain.com
SMTP_CC=it@domain.com;ops@domain.com
SMTP_BCC=
GEMINI_AUTO_MODEL_FALLBACK=true
GEMINI_FALLBACK_MODELS=gemini-2.5-flash,gemini-2.0-flash
GEMINI_MODEL_RETRY_DELAY=5
```

```
SMTP_TO=manager@domain.com;supervisor@domain.com
SMTP_CC=it@domain.com;ops@domain.com
```

Generate report sekaligus kirim email:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --send-email
```

Override penerima lewat terminal:

```powershell
python docs\weekly-report-generator\generate_weekly_report.py --send-email --email-to tujuan1@domain.com;tujuan2@domain.com
```

## Cronjob Server

Untuk server Linux, jadwalkan setiap Senin jam 07:00:

```cron
0 7 * * 1 cd /path/to/materialize-project && /usr/bin/python3 docs/weekly-report-generator/generate_weekly_report.py --days 7 --send-email >> docs/weekly-report-generator/weekly-report.log 2>&1
```

Alternatif pakai wrapper:

```bash
chmod +x docs/weekly-report-generator/run_weekly_report.sh
```

```cron
0 7 * * 1 /path/to/materialize-project/docs/weekly-report-generator/run_weekly_report.sh >> /path/to/materialize-project/docs/weekly-report-generator/weekly-report.log 2>&1
```

## Catatan Teknis

- Script membaca `docs/prompt-report-mingguan.md` setiap kali dijalankan, jadi perubahan aturan report langsung ikut dipakai.
- Default periode otomatis adalah 7 hari terakhir berdasarkan tanggal progress terbaru.
- Script menyertakan report mingguan terakhir sebagai konteks agar hasil baru bisa berkorelasi dengan report sebelumnya.
- Script tidak lagi memotong isi progress harian atau report sebelumnya di prompt.
- Default model memakai `gemini-flash-latest`, mengikuti contoh request Gemini yang sudah disiapkan.
- Jika Gemini mengembalikan `429`, `500`, atau `503`, script mencoba model fallback secara berurutan.
- Setelah terkena rate limit/error transient, script dapat mengambil daftar model dari `https://generativelanguage.googleapis.com/v1beta/models` dan memakai semua model yang mendukung `generateContent` sebagai fallback dinamis.
- Fallback model statis dapat diatur lewat `--fallback-models` atau environment variable `GEMINI_FALLBACK_MODELS`.
- Fallback dinamis dapat dimatikan lewat `--no-auto-model-fallback` atau `GEMINI_AUTO_MODEL_FALLBACK=false`.
- Jeda antar fallback model dapat diatur lewat `--model-retry-delay` atau `GEMINI_MODEL_RETRY_DELAY`.
- Request memakai header `X-goog-api-key` dan endpoint `generateContent`.
- Script otomatis membaca `.env` dari folder `docs/weekly-report-generator/` tanpa dependency tambahan.
- `SMTP_TO`, `SMTP_CC`, dan `SMTP_BCC` mendukung banyak alamat email dengan pemisah koma atau titik koma.
- Pengiriman email memakai SMTP STARTTLS. Untuk Microsoft 365, setting umum adalah `smtp.office365.com`, port `587`, STARTTLS.
- Jika akun memakai MFA atau SMTP AUTH dimatikan oleh admin, login SMTP bisa gagal. Gunakan app password/OAuth policy yang sesuai atau aktifkan Authenticated SMTP pada mailbox terkait.
- Jika Gemini API mengembalikan error quota, permission, atau model tidak tersedia, pesan error dari server akan ditampilkan di terminal.
