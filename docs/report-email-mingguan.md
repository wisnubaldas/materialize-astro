# Report Email Mingguan

File ini adalah panduan agent untuk membuat report mingguan dalam format email kepada stakeholder, manager, dan supervisor IT.

## Tujuan Report

Report mingguan harus merangkum pencapaian project MAU APP/CTOS secara jelas, praktis, dan mudah dipahami oleh pihak management.

Fokus utama report:

- Pencapaian aplikasi selama periode mingguan.
- Dampak terhadap operasional gudang cargo.
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

## Risiko / Gap / Blocker

## Rencana Minggu Berikutnya

## Penutup
```

## Gaya Bahasa

- Gunakan bahasa Indonesia yang formal, jelas, dan ringkas.
- Minimalkan detail implementasi seperti nama function, class, endpoint, migration, atau package, kecuali memang penting untuk konteks.
- Jelaskan perubahan teknis sebagai manfaat operasional, misalnya "validasi data lebih konsisten", "alur input lebih cepat", atau "monitoring lebih mudah".
- Hindari klaim selesai jika progress report masih menunjukkan gap, risiko, atau verifikasi yang belum dilakukan.
- Jika ada blocker, tulis dengan jujur dan sertakan dampak serta tindak lanjut.

## Penting

- Gunakan bahasa Indonesia yang sopan dan profesional.
- Jangan terlalu teknis.
- Jelaskan manfaat atau dampak terhadap user dan operasional.
- Hindari klaim selesai jika progress report masih menunjukkan gap, risiko, atau verifikasi yang belum dilakukan.
- Jika ada blocker, tulis dengan jujur dan sertakan dampak serta tindak lanjut.
- Korelasikan dengan report minggu lalu dan sebelumnya.
