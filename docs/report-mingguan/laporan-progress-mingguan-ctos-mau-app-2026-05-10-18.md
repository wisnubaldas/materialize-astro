# Laporan Progress Mingguan Project CTOS / MAU APP

**Periode:** 10–18 Mei 2026  
**Kepada:** Stakeholder, Manager, dan Supervisor IT  
**Subject:** Laporan Progress Mingguan Pengembangan Aplikasi CTOS / MAU APP

Yth. Bapak/Ibu Stakeholder, Manager, dan Supervisor IT,

Berikut saya sampaikan laporan progress pengembangan aplikasi CTOS / MAU APP untuk periode 10–18 Mei 2026. Secara umum, pekerjaan minggu ini berfokus pada pematangan alur operasional gudang, khususnya proses Build Up, penyiapan aplikasi mobile untuk kebutuhan operator, perbaikan modul EDI, serta peningkatan kestabilan backend dan frontend.

## Ringkasan Umum

Pada periode ini, progress utama berada pada empat area: backend API, frontend web, mobile app, dan modul EDI. Aplikasi semakin diarahkan agar proses operasional gudang dapat berjalan lebih terstruktur, mulai dari pencatatan Build Up, pengelolaan draft, input Master AWB, rincian pieces/weight, sampai pemantauan status selesai dan belum selesai.

Selain itu, aplikasi mobile mulai dipersiapkan sebagai alat kerja operator di lapangan. Tampilan mobile sudah dirapikan, navigasi dibuat lebih konsisten, form Build Up mulai terhubung ke backend, dan dashboard mulai menampilkan ringkasan operasional yang lebih mudah dipahami.

## Pencapaian Utama Minggu Ini

### 1. Backend FastAPI

Progress backend minggu ini difokuskan untuk memperkuat fondasi layanan API agar siap mendukung proses operasional gudang.

Pencapaian yang sudah dilakukan:

- Menambahkan dan menyempurnakan alur penyimpanan data Build Up Check, termasuk header, detail Master AWB, dan rincian pieces/weight.
- Menambahkan endpoint untuk kebutuhan mobile, sehingga aplikasi mobile dapat mengirim dan mengambil data Build Up dari backend.
- Menambahkan ringkasan Master AWB untuk dashboard, agar informasi jumlah pekerjaan selesai dan belum selesai dapat ditampilkan lebih cepat.
- Menyempurnakan aturan status selesai Build Up berdasarkan akumulasi rincian pieces, sehingga status pekerjaan lebih akurat.
- Menambahkan mekanisme buka kembali Build Up selesai dengan input Master AWB baru, agar proses koreksi atau penambahan data tetap terkontrol.
- Merapikan struktur backend untuk modul auth, setting, error response, warehouse, dan EDI agar lebih stabil dan mudah dikembangkan.
- Menambahkan penyimpanan draft Build Up ke database, sehingga data draft tidak hanya bergantung pada browser/local storage.

Dampak untuk bisnis/operasional:

- Data Build Up lebih aman karena tersimpan di backend.
- Alur input data operator menjadi lebih jelas dan bertahap.
- Dashboard dapat mengambil data ringkasan langsung dari server.
- Potensi kesalahan proses massal berkurang karena draft diproses per item, bukan submit/hapus semua sekaligus.

### 2. Frontend Astro + React

Progress frontend web berfokus pada perbaikan modul Warehouse Build Up, modul EDI, dan stabilitas tampilan.

Pencapaian yang sudah dilakukan:

- Menyempurnakan modul Build Up agar draft dapat diedit, ditambah Master AWB, dan tetap tersimpan dengan alur yang lebih aman.
- Mengubah penyimpanan draft Build Up dari local storage ke backend database.
- Menambahkan validasi data Build Up, termasuk MAWB, airline code, flight number, origin/destination, ULD, pieces, weight, dan volume.
- Menambahkan dukungan volume/MC pada proses Build Up dan FFM.
- Menyempurnakan preview EDI seperti FFM, FHL, dan FWB agar hasil Cargo-IMP dan Cargo-XML dapat ditinjau dari UI.
- Membersihkan komponen lama yang tidak lagi dipakai agar aplikasi lebih ringan dan mudah dirawat.
- Memperbaiki beberapa masalah tampilan dan build frontend, termasuk halaman Angkasapura dan modal detail Build Up.

Dampak untuk bisnis/operasional:

- User dapat mengecek format data sebelum proses pengiriman EDI.
- Risiko data tidak lengkap sebelum submit menjadi lebih kecil.
- Proses Build Up di web menjadi lebih aman karena draft dapat diedit dan diproses satu per satu.
- Tampilan modal dan tabel menjadi lebih konsisten untuk penggunaan operasional.

### 3. Mobile App Expo + React Native

Progress mobile app menjadi salah satu fokus terbesar minggu ini. Aplikasi mobile mulai dibentuk sebagai alat kerja operator gudang.

Pencapaian yang sudah dilakukan:

- Migrasi mobile app ke React Native + Expo agar lebih sesuai untuk penggunaan mobile.
- Menghubungkan login mobile ke backend.
- Menyiapkan tampilan Login, Dashboard, dan Build Up Checklist.
- Menambahkan UI kit mobile agar tampilan komponen seperti tombol, input, card, badge, dan loading lebih konsisten.
- Menggunakan Expo Router untuk navigasi aplikasi mobile.
- Menambahkan barcode scanner untuk input AWB/MAWB dan ULD.
- Menambahkan halaman Draft Build Up, Master AWB, rincian Build Up, dan Build Up Selesai.
- Menambahkan footer menu global untuk navigasi Home, Build Up, Draft, EDI, dan Warehouse.
- Menambahkan filter tanggal pada daftar Build Up selesai.
- Menambahkan dashboard summary untuk menampilkan jumlah Master AWB yang sudah selesai dan belum selesai.
- Menambahkan komponen visual dashboard seperti Metric Card, Header Metric Card, dan Patterned Card agar tampilan lebih informatif dan rapi.
- Menambahkan dokumentasi build APK, baik melalui EAS Cloud maupun local build.

Dampak untuk bisnis/operasional:

- Operator mulai memiliki alur kerja mobile untuk mencatat Build Up dari lapangan.
- Input data menjadi lebih cepat karena sudah ada dukungan scanner.
- Informasi pekerjaan selesai/belum selesai dapat dipantau dari dashboard mobile.
- Navigasi aplikasi lebih konsisten karena menu utama sudah disatukan.
- Aplikasi mobile semakin siap untuk diuji di device fisik.

### 4. Desktop App

Pada periode laporan ini belum ada catatan progress khusus untuk desktop app. Fokus pekerjaan masih berada pada backend, frontend web, mobile app, serta alur EDI/Build Up.

## Hasil Verifikasi

Beberapa verifikasi yang sudah dilakukan selama periode ini:

- Build frontend web berhasil dijalankan beberapa kali.
- Pemeriksaan backend berhasil dijalankan dan tidak menemukan blocker teknis.
- Migrasi database untuk beberapa kebutuhan Build Up dan EDI sudah disiapkan.
- Export mobile web dan Android berhasil dijalankan beberapa kali.
- Expo Doctor mayoritas berhasil dengan catatan warning tertentu yang masih perlu diputuskan sesuai strategi native/managed project.
- Login backend dan beberapa endpoint mobile berhasil diuji pada environment development.
- Beberapa validasi EDI sudah diuji hingga format message dapat terbaca oleh parser eksternal pada sample tertentu.

## Gap / Risiko yang Perlu Diperhatikan

Beberapa hal yang masih perlu diperhatikan:

- Migration database perlu dijalankan di environment target sebelum fitur Build Up Check digunakan penuh.
- Pengujian langsung di device fisik masih diperlukan, terutama untuk scanner, footer menu, dashboard, dark mode, dan input rincian.
- Beberapa menu mobile seperti EDI dan Warehouse sudah tampil, tetapi route/screen mobile-nya belum aktif.
- Build APK/AAB final masih memerlukan setup environment atau akun/build workflow yang sesuai.
- Konfigurasi IP LAN untuk testing mobile bisa berubah jika berpindah jaringan, sehingga perlu dokumentasi atau mekanisme konfigurasi yang lebih praktis.
- Desktop app belum masuk dalam progress implementasi periode ini.

## Rencana Lanjutan

Rencana pekerjaan berikutnya:

- Uji end-to-end flow Build Up dari mobile menggunakan user login dan data backend asli.
- Jalankan migration database di environment target/staging.
- Uji flow Draft Build Up, tambah Master AWB, input rincian pieces/weight, dan status selesai/belum selesai.
- Uji proses buka kembali Build Up selesai dari mobile.
- Validasi dashboard mobile dengan data real agar angka selesai/belum selesai sesuai kondisi operasional.
- Lanjutkan aktivasi menu EDI dan Warehouse di mobile jika screen/flow-nya sudah siap.
- Lanjutkan pengujian EDI dengan sample data produksi/staging agar format FFM/FHL/FWB semakin matang.
- Siapkan pengujian APK di device fisik setelah konfigurasi build disepakati.

## Kesimpulan

Secara keseluruhan, progress minggu ini menunjukkan perkembangan signifikan pada kesiapan aplikasi CTOS / MAU APP, terutama untuk mendukung operasional Build Up di gudang. Backend semakin siap sebagai pusat data dan proses, frontend web semakin stabil untuk kebutuhan administrasi dan preview EDI, sedangkan mobile app mulai siap menjadi alat bantu operator di lapangan.

Belum ada blocker teknis utama pada periode ini. Fokus berikutnya adalah pengujian end-to-end di environment target, validasi data real, serta penyelesaian alur mobile agar dapat digunakan lebih dekat dengan kebutuhan operasional harian.

Demikian laporan progress minggu ini saya sampaikan. Terima kasih.

Hormat saya,  
Wisnu Hidayat
