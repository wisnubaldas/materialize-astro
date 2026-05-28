# Report Email Mingguan

File ini adalah panduan agent untuk membuat report mingguan dalam format email kepada stakeholder, manager, dan supervisor IT.

## Tujuan Report

Report mingguan harus merangkum pencapaian project MAU APP/CTOS secara jelas, praktis, dan mudah dipahami oleh pihak management.

Fokus utama report:

- Pencapaian aplikasi selama periode mingguan.
- Dampak terhadap operasional gudang cargo yang langsung dirasakan user operasional.
- Status pengerjaan per aplikasi.
- Risiko, gap, atau blocker yang perlu diketahui management.
- Rencana kerja minggu berikutnya.

Hindari report yang terlalu teknis. Jika perlu menyebut istilah teknis, jelaskan manfaat atau dampaknya terhadap user dan operasional.

## Sumber Data

Rangkum progress dari file-file Markdown di:

```text
docs/report-progress/
```

Gunakan periode tanggal absolut sesuai file progress yang dirangkum, misalnya `2026-05-10` sampai `2026-05-18`.

## Lokasi Output

Simpan report mingguan di folder:

```text
docs/report-mingguan/
```

Gunakan nama file deskriptif dengan rentang tanggal absolut:

```text
laporan-progress-mingguan-ctos-mau-app-YYYY-MM-DD-DD.md
```

Contoh:

```text
docs/report-mingguan/laporan-progress-mingguan-ctos-mau-app-2026-05-10-18.md
```

## Project yang Dirangkum

1. [Backend FastAPI](../materialize-fastapi)
   Aplikasi porting dari aplikasi gudang CTOS. Perannya sebagai backend API dan source of truth untuk data, validasi, proses bisnis, role/permission, audit, serta integrasi.
2. [Frontend Astro + React](../astro)
   Aplikasi web yang berinteraksi langsung dengan user dan mengonsumsi API backend resmi.
3. [Desktop Aplikasi](../desktop-app)
   Aplikasi desktop pendukung operasional gudang berbasis C# + WPF, berjalan di Windows, dan tetap mengonsumsi backend API.
4. [Mobile Aplikasi](../mobile-app)
   Aplikasi mobile pendukung operasional berbasis Expo + React Native, dan tetap mengonsumsi backend API.

## Format Email

Gunakan struktur berikut:

```markdown
Subject: Laporan Progress Mingguan MAU APP / CTOS - [Periode]

Dear Teams,

Berikut kami sampaikan laporan progress mingguan pengembangan MAU APP / CTOS.

## Ringkasan Eksekutif

## Pencapaian Utama Minggu Ini

## Progress per Aplikasi

### Backend FastAPI

### Frontend Web Astro + React

### Desktop App

### Mobile App

## Dampak terhadap Operasional

Isi bagian ini hanya dengan dampak langsung terhadap proses operasional gudang cargo, seperti akurasi data, kecepatan alur kerja petugas, stabilitas proses manifest/buildup, integrasi operasional, atau kemudahan penggunaan aplikasi oleh user lapangan.

Jangan memasukkan manfaat internal developer, administrasi proyek, otomasi laporan, tooling AI agent, refactor internal, atau efisiensi kerja tim IT ke bagian ini. Jika periode hanya berisi perubahan internal developer, tulis bahwa belum ada dampak operasional langsung pada periode ini.

## Risiko / Gap / Blocker

## Rencana Minggu Berikutnya

## Penutup
```

## Gaya Bahasa

- Gunakan bahasa Indonesia yang formal, jelas, dan ringkas.
- Minimalkan detail implementasi seperti nama function, class, endpoint, migration, atau package, kecuali memang penting untuk konteks.
- Jelaskan perubahan teknis sebagai manfaat operasional hanya jika dampaknya langsung ke user operasional, misalnya "validasi data lebih konsisten", "alur input lebih cepat", atau "monitoring operasional lebih mudah".
- Jangan mengubah manfaat internal developer menjadi klaim dampak operasional.
- Hindari klaim selesai jika progress report masih menunjukkan gap, risiko, atau verifikasi yang belum dilakukan.
- Jika ada blocker, tulis dengan jujur dan sertakan dampak serta tindak lanjut.

## Project On Hold

- PELAKSANAAN PERHITUNGAN DAN PELAPORAN IMPORT CLEARANCE TIME OLEH PENGUSAHA TEMPAT PENIMBUNAN SEMENTARA DI LINGKUNGAN KANTOR PELAYANAN UTAMA BEA DAN CUKAI TIPE C SOEKARNO HATTA
- [Kirim Foto X-RAY (In Development)](https://ceisa40.gitbook.io/pia-ceisa40/api-services-barang-kiriman/daftar-service-impor-barang-kiriman/kirim-foto-x-ray-in-development)

## Penting

- Gunakan bahasa Indonesia yang sopan dan profesional.
- Jangan terlalu teknis.
- Jelaskan manfaat atau dampak terhadap user dan operasional hanya untuk perubahan yang memang menyentuh proses operasional.
- Tooling internal developer, otomasi laporan, cleanup code, dan aturan AI agent tidak boleh dimasukkan ke bagian Dampak terhadap Operasional.
- Hindari klaim selesai jika progress report masih menunjukkan gap, risiko, atau verifikasi yang belum dilakukan.
- Jika ada blocker, tulis dengan jujur dan sertakan dampak serta tindak lanjut.
- Korelasikan dengan report minggu lalu dan sebelumnya.
