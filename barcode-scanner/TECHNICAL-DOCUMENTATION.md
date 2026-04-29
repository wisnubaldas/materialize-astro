# Dokumentasi Teknis Barcode Scanner

## 1. Tujuan Teknis
Aplikasi ini dirancang untuk operasi scanning barcode dengan perangkat USB HID yang bertindak sebagai keyboard. Fokus utama desain:
- input stabil untuk kecepatan scanner,
- alur finalisasi scan berbasis Enter,
- validasi barcode sederhana tanpa dependency eksternal.

## 2. Struktur Project
```
barcode-scanner/
├── main.py
├── requirements.txt
├── README.md
└── TECHNICAL-DOCUMENTATION.md
```

## 3. Arsitektur Runtime
Komponen utama:
- `BarcodeScannerWindow`: container UI dan orchestration event scanner.
- `QLineEdit` (`barcode_input`): titik masuk seluruh karakter scanner.
- `eventFilter`: menangani keypress secara langsung dan ringan.
- `_scan_buffer`: buffer internal string untuk menahan karakter sampai Enter.
- `_barcode_registry`: simulasi database dictionary.
- `QListWidget` (`log_list`): menyimpan riwayat hasil scan.

## 4. Alur Pemrosesan Scan
1. Scanner mengirim karakter berurutan ke `barcode_input`.
2. `eventFilter` menangkap `QEvent.Type.KeyPress`.
3. Karakter printable ditambahkan ke `_scan_buffer`.
4. Ketika Enter terdeteksi (`Qt.Key_Return`/`Qt.Key_Enter`):
   - buffer dianggap satu barcode utuh,
   - sistem cek ke `_barcode_registry`,
   - hasil dicatat ke `log_list`,
   - buffer dan field input dibersihkan.

## 5. Strategi Menangani Input Cepat
- Logika keypress dibuat minimal agar tidak blocking.
- Tidak ada operasi I/O di jalur keypress.
- Buffer internal dipisahkan dari kontrol UI untuk mengurangi risiko kehilangan data.
- Fokus input dijaga periodik dengan `QTimer` setiap 250ms.

## 6. Simulasi Database
Simulasi database berada di method `_build_barcode_registry()`:
- tipe data: `dict[str, dict[str, str]]`
- key: nilai barcode
- value: metadata barang (`item_name`, `location`)

## 7. Pertimbangan Keamanan dan Reliabilitas
- Input selain karakter printable diabaikan/ditahan agar perilaku konsisten.
- Event key dikonsumsi untuk mencegah side effect fokus/UI saat operasional scanner.
- Tidak ada penyimpanan permanen sehingga tidak ada risiko kebocoran data melalui file lokal.

## 8. Pengembangan Lanjutan yang Direkomendasikan
- Ganti registry dictionary ke repository database (SQLite/PostgreSQL).
- Tambah layer service terpisah untuk validasi dan logging.
- Tambah export log scan (`.csv`) dan filter tanggal.
- Tambah health indicator untuk status konektivitas perangkat scanner.
