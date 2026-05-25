Subject: Laporan Progress Mingguan MAU APP / CTOS - Periode 19 - 24 Mei 2026

Dear Teams,

Berikut kami sampaikan laporan progress mingguan pengembangan MAU APP / CTOS.

## Ringkasan Eksekutif

Pada minggu ini (19 - 24 Mei 2026), pengembangan MAU APP/CTOS difokuskan pada peningkatan akurasi operasional di lapangan melalui transisi alur alokasi ULD (Build Up Check) dari planned ke actual allocation, perbaikan data preview FFM (EDI > FFM) dengan strategi fallback data dari SSoT (DB2), pembersihan kode legacy (dead code), pembenahan performa & visual antarmuka web, serta perbaikan konfigurasi editor proyek.

Seluruh fungsionalitas utama yang dideploy telah divalidasi sukses secara manual dan melalui pengujian kompilasi (build verification) baik pada backend maupun frontend.

## Pencapaian Utama Minggu Ini

1. **Alur Aktualisasi Alokasi ULD (Build Up Check):** Operator lapangan kini dapat menutup alokasi kontainer (ULD) secara dinamis sewaktu-waktu saat kontainer penuh, dan sistem secara otomatis mengonsolidasikan serta memvalidasi total actual pieces lintas ULD untuk mencegah kesalahan input melebihi kapasitas manifes udara (MAWB).
2. **Keandalan Preview FFM (Cargo-IMP):** Memperbaiki bug yang menghalangi pembuatan pesan FFM (Format Cargo-IMP) akibat data tidak lengkap dengan menerapkan rantai data fallback 3-langkah dari database SSoT (DB2), sehingga data origin, carrier, volume, pieces, dan weight dapat tersaji secara lengkap.
3. **Penyempurnaan Antarmuka & Pembersihan Kode:** Refaktorisasi komponen visual header halaman, penyematan animasi performant berbasis GPU, pembersihan sisa-sisa kode/endpoint buildup lama yang obsolete, serta penambahan file eksklusi build (`.easignore`) untuk mempercepat dan mengamankan rilis build aplikasi mobile.

## Progress per Aplikasi

### Backend FastAPI

- **Alur Kerja Build Up Check Baru:** Mengubah alokasi split ULD ke _actual allocation_. Menambahkan metadata `is_allocation_final` dan `allocation_closed_at` serta endpoint penutupan alokasi.
- **Validasi Lintas ULD:** Menerapkan validasi backend yang menolak penambahan barang jika total aktual pieces lintas kontainer melebihi kapasitas total MAWB pada penerbangan yang sama.
- **Peningkatan Modularitas API:** Memisahkan endpoint Build Up Check mobile dari modul umum ke router terisolasi (`app/api/build_up_check.py`) lengkap dengan unit service, repository, dependency injection, dan proteksi otorisasi yang aman.
- **Integrasi Fallback FFM SSoT (DB2):** Melakukan integrasi model `eks_invoiceheader` baru dan meningkatkan metode query FFM dengan chain fallback data dari DB2 (SSoT) secara aman (Read-Only) guna mengatasi kegagalan generate preview FFM akibat ketidaklengkapan data weighing.
- **Pembersihan Kode Legacy:** Menghapus endpoint `/export-buildup` lama dan service/dependencies buildup yang obsolete guna menjaga kebersihan kode (_code cleanup_).

### Frontend Web Astro + React

- **Modularisasi & Pembersihan Styling:** Memindahkan seluruh inline/embedded styles pada header halaman ke [CardPages.css](materialize-project/astro/src/components/react/ui/CardPages.css), menyederhanakan kode JavaScript komponen, serta mengembalikan skema warna asli proyek dan text-shadow kontras tinggi.
- **Tampilan 3D Timbul (Embossed) & Animasi:** Mendesain ulang aksen ikon berwujud 3D timbul dengan highlight bayangan berlapis dan latar belakang kontras tinggi. Menambahkan pula animasi kotak melayang CSS murni yang hemat resource (GPU-accelerated).
- **Pembersihan Modul Obsolete:** Menghapus method API client dan endpoint buildup legacy pada modul EDI.
- **Perbaikan Konfigurasi Proyek:** Memperbaiki file [jsconfig.json](materialize-project/astro/jsconfig.json) dengan menghapus opsi compiler yang tidak valid (`ignoreDeprecations: 6.0`) dan menyetel `"module": "ESNext"` untuk mengatasi error IntelliSense editor.

### Desktop App

- Seluruh API client pada aplikasi desktop yang mengarah ke endpoint lama telah disesuaikan dan dipastikan tetap berjalan selaras dengan perubahan API backend. Tidak ada perubahan arsitektur besar di sisi desktop minggu ini.

### Mobile App

- **Fitur Lapangan Baru:** Menyediakan tombol "Tutup Alokasi ULD" pada screen rincian Build Up agar operator gudang bisa menandai status ULD yang sudah penuh secara realtime.
- **Validasi Input Ketat:** Memperketat validasi angka untuk pieces dan weight sebelum dikirim ke server.
- **Progress Lintas ULD:** Menampilkan visualisasi progress MAWB lintas kontainer pada mobile screen sehingga operator dapat memantau keterisian barang yang terpisah di beberapa ULD.
- **Penyaringan Pintar:** Mengubah default filter draft agar otomatis membatasi pencarian daftar penerbangan per hari ini saja demi mempercepat load data operator.
- **Keamanan & Efisiensi Build:** Menambahkan file `.easignore` untuk mengecualikan dependensi lokal, cache, signing key, dan file rahasia lokal dari upload build server Expo (EAS Build).

## Dampak terhadap Operasional

- **Akurasi Data Cargo Lapangan:** Pencegahan input over-capacity lintas ULD meminimalkan kesalahan pelaporan manifes kargo fisik di gudang.
- **Kemudahan Operator:** Operator di lapangan memiliki kontrol langsung untuk menutup alokasi ULD yang penuh dari genggaman (aplikasi mobile), sementara sistem otomatis melacak dan menampilkan sisa muatan.
- **Pencegahan Error FFM (EDI):** Keberhasilan generasi FFM (Cargo-IMP) yang andal memperlancar pertukaran pesan pertukaran data elektronik dengan pihak maskapai/partner operasional eksternal.

## Risiko / Gap / Blocker

- **Uji End-to-End Database Nyata:** Diperlukan uji coba berkelanjutan untuk skenario mixed header (dimana sebagian kontainer dari satu MAWB sudah ditutup alokasinya, sementara sebagian kontainer lainnya masih menerima input) di server staging/development dengan database replika operasional.
- **Konfigurasi Expo Dokter:** Terdapat beberapa warning konfigurasi native existing di berkas `app.json` mobile (seperti `usesCleartextTraffic`) yang tidak mengganggu alur Build Up baru namun perlu dirapikan pada fase pembersihan konfigurasi mobile mendatang.

## Rencana Minggu Berikutnya

1. **Uji Skenario Lapangan Komprehensif:** Menguji alur penutupan alokasi ULD dan integrasi data FFM menggunakan dataset transaksi operasional skala penuh di lingkungan staging.
2. **Penyempurnaan Cetak PDF Server-Side:** Memastikan keselarasan cetakan PDF Manifes Cargo dan Lembar Checklist Build Up baru yang diterbitkan server-side backend FastAPI menggunakan Paper CSS A4.
3. **Pengembangan Modul Backlog:** Melanjutkan pengerjaan modul backlog operasional gudang cargo lainnya sesuai prioritas bisnis berikutnya.

## Penutup

Demikian laporan progress mingguan ini kami sampaikan. Kami berkomitmen untuk terus menghadirkan sistem operasional kargo lini 1 yang andal, akurat, dan berkinerja tinggi. Jika ada pertanyaan atau arahan tambahan, silakan hubungi tim pengembangan.

Salam hangat,
**Tim Pengembang MAU APP**
