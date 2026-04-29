# Barcode Scanner (PyQt6)

Project desktop sederhana untuk menerima input dari barcode scanner Symbol (USB HID/keyboard mode), memproses barcode saat tombol Enter diterima, lalu mencatat hasil validasi ke log UI.

## Fitur

- Satu `QLineEdit` yang dijaga agar selalu fokus.
- Event filter keyboard untuk menangkap input scanner berkecepatan tinggi.
- Enter (`ASCII 13`) sebagai penanda akhir scan.
- Simulasi database barcode menggunakan dictionary.
- Log hasil scan (terdaftar/tidak terdaftar) ditampilkan di UI.

## Prasyarat

- Python 3.10+.

## Instalasi

```bash
cd barcode-scanner
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Menjalankan Aplikasi

```bash
python main.py
```

## Cara Uji Cepat

1. Jalankan aplikasi.
2. Pastikan kursor berada di input scanner (otomatis dijaga oleh sistem fokus).
3. Scan barcode dari device Symbol.
4. Saat scanner mengirim Enter, aplikasi akan:
   - mengambil isi barcode,
   - memvalidasi ke dictionary,
   - menampilkan log hasil scan,
   - mengosongkan input kembali.

Contoh barcode terdaftar:

- `899999000001`
- `899999000002`
- `899999000003`
- `899999000004`
