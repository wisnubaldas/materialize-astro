# User Story Gudang Domestik — Incoming & Outgoing

Dokumen ini berisi daftar **user story** untuk aplikasi gudang domestik, khususnya proses **Outgoing** dan **Incoming**. Penyusunan dibuat berdasarkan source internal project seperti User Guide Warehouse Domestik dan SOP operasional gudang.

---

## 1. Tujuan Dokumen

Dokumen ini digunakan sebagai bahan awal untuk:

- Menyusun backlog aplikasi gudang domestik.
- Menentukan modul MVP.
- Menjadi referensi diskusi antara tim bisnis, operasional gudang, product owner, dan developer.
- Menurunkan kebutuhan sistem menjadi task teknis frontend, backend, database, dan report.

---

## 2. Ruang Lingkup

Ruang lingkup user story meliputi:

1. **Domestik Outgoing**
   - Acceptance / Cargo Weighing Proof / Bukti Timbang Barang
   - Cashier / Official Receipt / Invoice
   - Storage
   - Delivery / Build-Up
   - Offload
   - Monitoring dan Void

2. **Domestik Incoming**
   - Breakdown Checklist
   - Irregularities
   - Cargo Damage
   - Storage Incoming
   - Cargo Out / Delivery Order
   - Cashier Incoming
   - Monitoring dan Void

3. **Pendukung Umum**
   - Master data
   - Role access
   - Audit trail
   - Dashboard dan report

---

## 3. Keterangan Prioritas

| Prioritas | Keterangan |
|---|---|
| P0 | Wajib untuk operasional utama harian / MVP inti |
| P1 | Penting untuk kontrol, monitoring, validasi, dan koreksi data |
| P2 | Pendukung, enhancement, dashboard, audit lanjutan, atau reporting tambahan |

---

# A. User Story — Domestik Outgoing

## Epic OUT-01 — Acceptance / Penimbangan Cargo Outgoing

### OUT-001 — Input Cargo Outgoing

**Sebagai** petugas acceptance,  
**saya ingin** menginput data cargo outgoing berdasarkan SMU, customer, airline, route, flight, koli, dan berat,  
**agar** cargo dapat tercatat sebelum masuk proses gudang.

**Acceptance Criteria:**

- Petugas dapat memilih customer/shipper.
- Petugas dapat input nomor SMU.
- Petugas dapat memilih airline, destination, dan flight number.
- Petugas dapat input jumlah koli.
- Sistem menyimpan transaksi sebagai data CWP/BTB.

**Prioritas:** P0

---

### OUT-002 — Integrasi Timbangan

**Sebagai** petugas acceptance,  
**saya ingin** sistem menarik berat dari timbangan secara otomatis,  
**agar** berat gross lebih akurat dan tidak perlu input manual.

**Acceptance Criteria:**

- Berat gross tampil otomatis dari link timbangan.
- Sistem tetap menyediakan mekanisme koreksi sesuai otorisasi jika timbangan bermasalah.
- Berat pallet dapat diinput.
- Sistem menghitung netto/ACT-W setelah dikurangi pallet.

**Prioritas:** P0

---

### OUT-003 — Perhitungan CAW

**Sebagai** petugas acceptance,  
**saya ingin** sistem menghitung CAW berdasarkan berat aktual atau volume terbesar,  
**agar** dasar perhitungan biaya sesuai aturan cargo.

**Acceptance Criteria:**

- Sistem menghitung ACT-W dari berat bersih.
- Sistem menghitung volume weight jika dimensi diinput.
- Jika volume weight lebih besar dari ACT-W, maka CAW menggunakan volume weight.
- Jika ACT-W lebih besar dari volume weight, maka CAW menggunakan ACT-W.

**Prioritas:** P0

---

### OUT-004 — Cetak CWP / Bukti Timbang

**Sebagai** petugas acceptance,  
**saya ingin** mencetak dokumen CWP dan mendapatkan nomor entry CWP,  
**agar** shipper memiliki bukti timbang barang.

**Acceptance Criteria:**

- Sistem dapat mencetak dokumen CWP.
- Nomor CWP terbentuk otomatis setelah transaksi valid.
- CWP yang sudah dicetak dapat dipakai untuk proses pembayaran.
- Status CWP menjadi valid setelah tersimpan/tercetak.

**Prioritas:** P0

---

### OUT-005 — Report CWP per Shift

**Sebagai** supervisor acceptance,  
**saya ingin** melihat report CWP per shift,  
**agar** transaksi timbang selama shift dapat direkap.

**Acceptance Criteria:**

- Sistem menampilkan daftar transaksi CWP per shift.
- Filter tanggal dan shift tersedia.
- Report dapat dicetak atau diekspor.
- Data yang sudah masuk laporan tetap memiliki jejak transaksi.

**Prioritas:** P1

---

### OUT-006 — Void CWP

**Sebagai** petugas acceptance,  
**saya ingin** melakukan void CWP sebelum pembayaran,  
**agar** transaksi timbang yang salah bisa dibatalkan dengan alasan yang jelas.

**Acceptance Criteria:**

- CWP hanya dapat divoid jika belum dibayar.
- Sistem menampilkan detail CWP sebelum void.
- Petugas wajib input alasan void.
- Sistem menyimpan user, waktu, dan alasan void.
- Status CWP berubah menjadi void.

**Prioritas:** P1

---

## Epic OUT-02 — Cashier / Pembayaran Outgoing

### OUT-007 — Membuat Official Receipt / Invoice Outgoing

**Sebagai** kasir,  
**saya ingin** membuat invoice/kwitansi berdasarkan nomor CWP,  
**agar** pembayaran sewa gudang outgoing tercatat.

**Acceptance Criteria:**

- Kasir dapat input nomor CWP.
- Sistem menampilkan detail CWP.
- Sistem menghitung biaya sesuai tarif.
- Kasir dapat mencetak COR/OR/kwitansi.
- Nomor invoice/OR terbentuk otomatis.

**Prioritas:** P0

---

### OUT-008 — Ubah Customer Penagihan

**Sebagai** kasir,  
**saya ingin** mengganti customer penagihan jika berbeda dengan shipper di CWP,  
**agar** invoice ditagihkan ke pihak yang benar.

**Acceptance Criteria:**

- Kasir dapat memilih customer lain sebagai pihak tertagih.
- Perubahan customer tidak mengubah data shipper asli pada CWP.
- Sistem menyimpan informasi pihak tertagih.
- Perubahan tercatat dalam audit log.

**Prioritas:** P1

---

### OUT-009 — Monitoring CWP Belum Bayar

**Sebagai** kasir,  
**saya ingin** melihat monitoring CWP yang belum dibayar,  
**agar** dapat mengingatkan shipper/agen untuk melakukan pembayaran.

**Acceptance Criteria:**

- Sistem menampilkan CWP valid yang belum memiliki pembayaran.
- Data otomatis hilang dari monitoring setelah dibayar.
- Filter berdasarkan tanggal, customer, airline, dan flight tersedia.
- Data dapat dicetak atau diekspor.

**Prioritas:** P0

---

### OUT-010 — Rekap OR / DRSC per Shift

**Sebagai** kasir atau supervisor,  
**saya ingin** melihat rekap OR/DRSC per shift,  
**agar** uang diterima dan invoice yang diterbitkan dapat dicocokkan.

**Acceptance Criteria:**

- Sistem menampilkan daftar invoice per shift.
- Sistem menampilkan total nilai transaksi.
- Data dapat dicetak sebagai laporan serah terima.
- Data dapat difilter berdasarkan tanggal dan shift.

**Prioritas:** P1

---

### OUT-011 — Void OR Outgoing

**Sebagai** kasir,  
**saya ingin** melakukan void OR dengan alasan,  
**agar** invoice yang salah dapat dibatalkan secara terkontrol.

**Acceptance Criteria:**

- Sistem menampilkan detail OR sebelum void.
- Kasir wajib input alasan void.
- Sistem menyimpan user, waktu, dan alasan void.
- Status OR berubah menjadi void.
- CWP terkait dapat dikembalikan ke status belum bayar jika aturan bisnis mengizinkan.

**Prioritas:** P1

---

## Epic OUT-03 — Storage Outgoing

### OUT-012 — Stock Cargo Siap Build-Up

**Sebagai** petugas storage,  
**saya ingin** melihat daftar cargo yang sudah ditimbang dan dibayar,  
**agar** saya tahu cargo mana yang siap dibuild-up.

**Acceptance Criteria:**

- Sistem hanya menampilkan SMU yang sudah CWP dan sudah dibayar.
- Sistem hanya menampilkan cargo yang belum build-up.
- Data menampilkan SMU, customer, airline, destination, flight, koli, berat, dan status.

**Prioritas:** P0

---

### OUT-013 — Filter Stock Outgoing

**Sebagai** petugas storage,  
**saya ingin** memfilter stock outgoing berdasarkan all cargo, airline, atau flight number,  
**agar** pencarian cargo lebih cepat.

**Acceptance Criteria:**

- Filter All Cargo tersedia.
- Filter One Airline tersedia.
- Filter Flight Number tersedia.
- Hasil filter sesuai parameter yang dipilih.

**Prioritas:** P1

---

### OUT-014 — Monitoring Stock per Tanggal

**Sebagai** supervisor gudang,  
**saya ingin** melihat stock outgoing per tanggal,  
**agar** kontrol cargo yang masih berada di storage dapat dilakukan.

**Acceptance Criteria:**

- Sistem menampilkan stock berdasarkan tanggal storage.
- Sistem menampilkan status cargo belum build-up.
- Data dapat dicetak atau diekspor.

**Prioritas:** P1

---

## Epic OUT-04 — Delivery / Build-Up Outgoing

### OUT-015 — Membuat Build-Up Report

**Sebagai** petugas build-up,  
**saya ingin** membuat build-up report berdasarkan airline, destination, flight, dan aircraft registration,  
**agar** cargo siap diberangkatkan.

**Acceptance Criteria:**

- Petugas dapat memilih tanggal build-up.
- Petugas dapat memilih airline.
- Petugas dapat memilih destination.
- Petugas dapat memilih flight number.
- Petugas dapat input aircraft registration.
- Sistem menampilkan daftar SMU siap build-up.

**Prioritas:** P0

---

### OUT-016 — Pilih SMU untuk Build-Up

**Sebagai** petugas build-up,  
**saya ingin** memilih SMU yang akan dimasukkan ke build-up,  
**agar** hanya cargo yang benar-benar berangkat yang masuk manifest.

**Acceptance Criteria:**

- Petugas dapat memilih satu atau banyak SMU dari daftar.
- Sistem mencegah pemilihan SMU yang belum dibayar.
- Sistem mencegah pemilihan SMU yang sudah build-up.
- Input pieces dan weight tidak boleh melebihi hasil timbang.

**Prioritas:** P0

---

### OUT-017 — Input Detail Build-Up

**Sebagai** petugas build-up,  
**saya ingin** menginput ULD/Cart Number, agen, dan condition of goods,  
**agar** detail loading cargo tercatat.

**Acceptance Criteria:**

- Field ULD/Cart Number tersedia.
- Field agen tersedia jika dibutuhkan.
- Field condition of goods tersedia.
- Data tersimpan di build-up detail.

**Prioritas:** P1

---

### OUT-018 — Generate Nomor Build-Up

**Sebagai** supervisor delivery,  
**saya ingin** sistem menghasilkan nomor Build-Up setelah data valid,  
**agar** dokumen build-up dapat dijadikan referensi operasional.

**Acceptance Criteria:**

- Nomor Build-Up terbentuk otomatis setelah save/update.
- Status SMU berubah menjadi sudah build-up.
- Dokumen build-up dapat dicetak.
- Data build-up dapat dicari ulang berdasarkan nomor build-up, flight, atau tanggal.

**Prioritas:** P0

---

### OUT-019 — Cargo Offload

**Sebagai** petugas delivery,  
**saya ingin** melakukan offload atau perubahan SMU/airline/flight/destination,  
**agar** cargo yang batal atau berubah penerbangan dapat dikoreksi.

**Acceptance Criteria:**

- Petugas dapat input SMU lama.
- Sistem menampilkan detail data awal.
- Petugas dapat input SMU/airline/flight/destination baru jika diperlukan.
- Sistem menyimpan alasan offload.
- Status cargo berubah menjadi offload atau reschedule.

**Prioritas:** P1

---

# B. User Story — Domestik Incoming

## Epic INC-01 — Acceptance Incoming / Breakdown

### INC-001 — Input Breakdown Checklist

**Sebagai** checker incoming,  
**saya ingin** menginput Cargo Breakdown Checklist dari dokumen manifest,  
**agar** cargo kedatangan tercatat per flight.

**Acceptance Criteria:**

- Petugas dapat input tanggal flight.
- Petugas dapat memilih airline.
- Petugas dapat input origin/route.
- Petugas dapat memilih flight number.
- Petugas dapat input arrival time.
- Petugas dapat input transit station jika ada.
- Petugas dapat input aircraft registration dan supervisor.

**Prioritas:** P0

---

### INC-002 — Input Detail SMU Incoming

**Sebagai** checker incoming,  
**saya ingin** menginput detail SMU dari manifest,  
**agar** setiap cargo incoming tercatat koli, berat, origin, jenis barang, ULD/Cart, dan remark-nya.

**Acceptance Criteria:**

- Petugas dapat input nomor SMU.
- Petugas dapat input partial/parsial jika ada.
- Petugas dapat input origin.
- Petugas dapat input jumlah koli.
- Petugas dapat input berat.
- Petugas dapat memilih kind of goods.
- Petugas dapat input ULD/Cart.
- Petugas dapat input remark.
- Data berpindah ke grid detail.

**Prioritas:** P0

---

### INC-003 — Simpan Breakdown dan Generate Nomor

**Sebagai** checker incoming,  
**saya ingin** menyimpan breakdown dan mendapatkan nomor breakdown,  
**agar** dokumen kedatangan memiliki referensi sistem.

**Acceptance Criteria:**

- Sistem memvalidasi header dan detail breakdown.
- Sistem menghasilkan nomor breakdown otomatis.
- Data breakdown dapat dicari ulang.
- Status cargo menjadi masuk gudang/storage.

**Prioritas:** P0

---

### INC-004 — Multi SMU dalam Satu Breakdown

**Sebagai** supervisor incoming,  
**saya ingin** seluruh SMU pada manifest dapat diinput berulang dalam satu breakdown,  
**agar** data manifest lengkap.

**Acceptance Criteria:**

- Sistem mengizinkan banyak detail SMU dalam satu breakdown.
- Sistem menghitung total koli dan berat.
- Sistem mencegah duplikasi SMU dalam breakdown yang sama kecuali ditandai parsial.

**Prioritas:** P0

---

## Epic INC-02 — Irregularities & Cargo Damage Incoming

### INC-005 — Catat Irregularities

**Sebagai** checker incoming,  
**saya ingin** mencatat irregularities cargo,  
**agar** selisih atau masalah cargo dapat terdokumentasi.

**Acceptance Criteria:**

- Petugas dapat input airline.
- Petugas dapat input flight, tanggal, dan route.
- Petugas dapat input nomor manifest.
- Petugas dapat input crew chief atau supervisor.
- Petugas dapat input SMU, shipper, consignee, koli, part koli, weight, contents, dan remarks.
- Sistem menyimpan data irregularities.

**Prioritas:** P0

---

### INC-006 — Generate Nomor Irregularities

**Sebagai** checker incoming,  
**saya ingin** sistem membuat nomor irregularities otomatis,  
**agar** laporan dapat dilacak.

**Acceptance Criteria:**

- Nomor irregularities terbentuk setelah save.
- Nomor unik dan dapat dicari ulang.
- Sistem menyimpan user pembuat dan waktu pencatatan.

**Prioritas:** P1

---

### INC-007 — Catat Cargo Damage

**Sebagai** checker incoming,  
**saya ingin** mencatat cargo damage secara detail,  
**agar** kerusakan cargo yang tiba dapat diproses dan dilaporkan.

**Acceptance Criteria:**

- Petugas dapat memilih/input SMU.
- Petugas dapat mencatat jenis kerusakan.
- Petugas dapat mencatat jumlah koli terdampak.
- Petugas dapat input remark dan keterangan barang.
- Sistem menyimpan laporan cargo damage.

**Prioritas:** P0

---

## Epic INC-03 — Storage Incoming

### INC-008 — Lihat Stock Cargo Incoming

**Sebagai** petugas storage incoming,  
**saya ingin** melihat stock cargo yang ada di storage,  
**agar** saya tahu cargo mana yang masih tersimpan.

**Acceptance Criteria:**

- Sistem menampilkan cargo yang masuk dari breakdown.
- Sistem menampilkan SMU, airline, flight, origin, koli, berat, lokasi, dan status.
- Data dapat difilter berdasarkan tanggal, airline, flight, dan SMU.

**Prioritas:** P0

---

### INC-009 — Load Sisa Cargo

**Sebagai** petugas storage incoming,  
**saya ingin** melihat hanya cargo sisa,  
**agar** pencarian cargo yang belum keluar lebih cepat.

**Acceptance Criteria:**

- Sistem menyediakan filter Load Sisa.
- Hasil hanya menampilkan cargo yang belum keluar/delivery.
- Data dapat dicetak atau diekspor.

**Prioritas:** P0

---

### INC-010 — Stock Opname Incoming

**Sebagai** supervisor storage,  
**saya ingin** membandingkan data sistem dengan fisik cargo,  
**agar** stock opname dapat dilakukan.

**Acceptance Criteria:**

- Sistem menyediakan daftar stock incoming sebagai dasar pengecekan fisik.
- Petugas dapat mencatat hasil pengecekan fisik.
- Sistem dapat menandai selisih antara data sistem dan kondisi fisik.

**Prioritas:** P1

---

## Epic INC-04 — Delivery Incoming / Cargo Keluar Gudang

### INC-011 — Buat CWP/BTB Incoming

**Sebagai** petugas delivery incoming,  
**saya ingin** membuat CWP/BTB cargo incoming,  
**agar** berat cargo yang akan keluar tercatat.

**Acceptance Criteria:**

- Petugas dapat input company/consignee.
- Petugas dapat input SMU.
- Sistem menampilkan detail cargo dari breakdown/storage jika tersedia.
- Petugas dapat input koli, pallet, gross, ACT-W, dan CAW.
- Sistem dapat mencetak CWP/BTB.

**Prioritas:** P0

---

### INC-012 — Report Incoming CWP per Shift

**Sebagai** petugas delivery incoming,  
**saya ingin** melihat report incoming CWP per shift,  
**agar** transaksi timbang delivery dapat direkap.

**Acceptance Criteria:**

- Sistem menampilkan daftar CWP incoming per shift.
- Filter tanggal dan shift tersedia.
- Report dapat dicetak atau diekspor.

**Prioritas:** P1

---

### INC-013 — Void CWP Incoming

**Sebagai** petugas delivery incoming,  
**saya ingin** melakukan void CWP dengan alasan,  
**agar** transaksi penimbangan salah bisa dibatalkan.

**Acceptance Criteria:**

- Petugas dapat input nomor CWP.
- Sistem menampilkan detail CWP.
- Alasan void wajib diisi.
- Sistem menyimpan user, waktu, dan alasan void.
- Status CWP berubah menjadi void.

**Prioritas:** P1

---

### INC-014 — Membuat Delivery Order

**Sebagai** petugas delivery incoming,  
**saya ingin** membuat Delivery Order,  
**agar** cargo dapat keluar gudang secara resmi.

**Acceptance Criteria:**

- Sistem membuat dokumen DO berdasarkan data cargo valid.
- Cargo harus ada di storage dan belum keluar.
- Data consignee atau pihak pengambil dapat dicatat.
- DO dapat dicetak.
- Status cargo berubah menjadi proses delivery atau keluar sesuai flow.

**Prioritas:** P0

---

### INC-015 — Find Data Cargo Berdasarkan SMU

**Sebagai** petugas delivery incoming,  
**saya ingin** mencari data cargo berdasarkan SMU,  
**agar** saya dapat mengetahui pcs dan berat cargo sebelum diproses keluar.

**Acceptance Criteria:**

- Petugas dapat input nomor SMU.
- Sistem menampilkan pcs dan berat cargo.
- Sistem menampilkan status cargo.
- Sistem menampilkan lokasi cargo jika tersedia.

**Prioritas:** P1

---

## Epic INC-05 — Cashier Incoming

### INC-016 — Membuat Official Receipt Incoming

**Sebagai** kasir incoming,  
**saya ingin** membuat Official Receipt berdasarkan BTB/CWP,  
**agar** pembayaran sewa gudang incoming tercatat.

**Acceptance Criteria:**

- Kasir dapat input nomor BTB/CWP.
- Sistem menampilkan detail transaksi.
- Sistem menghitung biaya sesuai tarif incoming.
- Invoice/OR dapat dicetak.
- Nomor OR terbentuk otomatis.

**Prioritas:** P0

---

### INC-017 — Rekap OR Incoming per Shift

**Sebagai** kasir incoming,  
**saya ingin** melihat rekap official receipt per shift,  
**agar** uang dan invoice yang diterbitkan dapat dicocokkan.

**Acceptance Criteria:**

- Sistem menampilkan daftar invoice per shift.
- Sistem menampilkan total nilai transaksi.
- Data dapat dicetak untuk laporan kasir.

**Prioritas:** P1

---

### INC-018 — Void OR Incoming

**Sebagai** kasir incoming,  
**saya ingin** void OR dengan alasan,  
**agar** invoice salah dapat dibatalkan secara resmi.

**Acceptance Criteria:**

- Kasir dapat input nomor OR/invoice.
- Sistem menampilkan detail OR.
- Alasan void wajib diisi.
- Sistem menyimpan user, waktu, dan alasan void.
- Status invoice menjadi void.

**Prioritas:** P1

---

### INC-019 — Monitoring DO/CWP Belum Bayar

**Sebagai** kasir atau supervisor,  
**saya ingin** memonitor DO atau CWP yang belum dibayar,  
**agar** consignee dapat diingatkan sebelum cargo keluar.

**Acceptance Criteria:**

- Sistem menampilkan DO/CWP yang belum dibayar.
- Data otomatis hilang dari monitoring setelah pembayaran.
- Filter tanggal, customer, SMU, dan nomor DO tersedia.

**Prioritas:** P0

---

# C. User Story Pendukung / Master & Audit

## Epic GEN-01 — Master Data

### GEN-001 — Master Customer

**Sebagai** admin,  
**saya ingin** mengelola master customer,  
**agar** data shipper, consignee, agen, dan pihak tertagih dapat dipakai di CWP, DO, dan invoice.

**Acceptance Criteria:**

- Admin dapat tambah, edit, nonaktifkan customer.
- Customer dapat dicari dari form transaksi.
- Data customer mencakup nama, alamat, kontak, NPWP jika diperlukan, dan status aktif.

**Prioritas:** P0

---

### GEN-002 — Master Airline, Route, dan Flight

**Sebagai** admin,  
**saya ingin** mengelola master airline, route, dan flight,  
**agar** transaksi incoming/outgoing memakai referensi yang konsisten.

**Acceptance Criteria:**

- Admin dapat mengelola airline.
- Admin dapat mengelola route/origin/destination.
- Admin dapat mengelola flight number.
- Master data dapat dipakai di CWP, breakdown, build-up, report, dan monitoring.

**Prioritas:** P0

---

## Epic GEN-02 — Audit Trail dan Role Access

### GEN-003 — Audit Trail Void dan Perubahan Data

**Sebagai** supervisor,  
**saya ingin** semua transaksi void dan perubahan penting menyimpan alasan, user, tanggal, dan waktu,  
**agar** audit operasional jelas.

**Acceptance Criteria:**

- Void CWP menyimpan alasan, user, dan timestamp.
- Void OR menyimpan alasan, user, dan timestamp.
- Void DO jika tersedia menyimpan alasan, user, dan timestamp.
- Perubahan flight, SMU, offload, dan status penting tersimpan di log.

**Prioritas:** P1

---

### GEN-004 — Hak Akses Berdasarkan Role

**Sebagai** user operasional,  
**saya ingin** hak akses berdasarkan role,  
**agar** menu yang tampil sesuai tugas masing-masing.

**Acceptance Criteria:**

- Role acceptance hanya dapat akses form acceptance.
- Role cashier hanya dapat akses cashier dan report kasir.
- Role storage hanya dapat akses storage.
- Role delivery hanya dapat akses delivery/build-up/breakdown sesuai penugasan.
- Role supervisor dapat melihat monitoring dan report.
- Role admin dapat mengelola master dan konfigurasi.

**Prioritas:** P0

---

## Epic GEN-03 — Dashboard dan Report

### GEN-005 — Dashboard Operasional Harian

**Sebagai** manajemen,  
**saya ingin** dashboard ringkas incoming/outgoing,  
**agar** saya dapat melihat jumlah cargo masuk, keluar, belum bayar, belum build-up, dan sisa storage.

**Acceptance Criteria:**

- Dashboard menampilkan total cargo outgoing hari ini.
- Dashboard menampilkan total cargo incoming hari ini.
- Dashboard menampilkan CWP/DO belum bayar.
- Dashboard menampilkan cargo belum build-up.
- Dashboard menampilkan stock/sisa storage.
- Filter tanggal, shift, airline, dan flight tersedia.

**Prioritas:** P2

---

# D. Rekomendasi MVP

Untuk tahap awal pengembangan aplikasi gudang domestik, MVP disarankan mencakup alur berikut:

## MVP Outgoing

1. Input CWP/BTB Outgoing.
2. Integrasi timbangan atau input berat manual terkontrol.
3. Cetak CWP.
4. Monitoring CWP belum bayar.
5. Pembayaran / OR Outgoing.
6. Stock cargo siap build-up.
7. Build-Up cargo.
8. Void CWP dan Void OR dengan audit trail.

## MVP Incoming

1. Input Breakdown Checklist.
2. Input detail SMU incoming.
3. Storage incoming / stock cargo.
4. Find Data Cargo berdasarkan SMU.
5. Delivery Order.
6. CWP/BTB Incoming jika diperlukan untuk cargo keluar.
7. Pembayaran / OR Incoming.
8. Monitoring DO/CWP belum bayar.
9. Irregularities dan Cargo Damage.

---

# E. Modul Sistem yang Disarankan

## 1. Modul Outgoing

- Acceptance CWP
- Report CWP
- Void CWP
- Monitoring Unpaid CWP
- Official Receipt / Invoice
- Recapitulation OR / DRSC
- Void OR
- Stock Report Outgoing
- Build-Up Report
- Cargo Offload

## 2. Modul Incoming

- Breakdown Checklist
- Irregularities Report
- Cargo Damage
- Stock Report Incoming
- Find Data Cargo
- Delivery Order
- CWP/BTB Incoming
- Official Receipt Incoming
- Recapitulation OR Incoming
- Void OR Incoming
- Monitoring DO/CWP

## 3. Modul Master

- Customer
- Airline
- Flight
- Route / Origin / Destination
- Kind of Goods
- Tariff
- Shift
- User dan Role

## 4. Modul Report

- CWP Daily Report
- OR Recapitulation
- DRSC
- Stock Report
- Build-Up Report
- Breakdown Report
- Irregularities Report
- Cargo Damage Report
- Unpaid Monitoring Report

---

# F. Catatan Teknis untuk Developer

Berikut beberapa catatan awal untuk desain sistem:

1. **Nomor dokumen harus auto-generate**
   - CWP/BTB Number
   - OR/Invoice Number
   - Build-Up Number
   - Breakdown Number
   - DO Number
   - Irregularities Number

2. **Status cargo perlu jelas**
   - Draft
   - Weighed
   - Paid
   - Stored
   - Built-Up
   - Offloaded
   - Delivered
   - Void
   - Damaged
   - Irregular

3. **Audit trail wajib untuk transaksi sensitif**
   - Void CWP
   - Void OR
   - Void DO
   - Offload
   - Perubahan berat
   - Perubahan flight
   - Perubahan customer tagihan

4. **Relasi data utama**
   - Customer ke CWP/Invoice/DO
   - SMU ke CWP/Breakdown/Build-Up/Delivery
   - Flight ke Breakdown dan Build-Up
   - CWP ke OR
   - DO ke OR Incoming

5. **Validasi utama**
   - CWP tidak boleh dibayar dua kali.
   - CWP yang sudah dibayar tidak boleh void sembarangan.
   - Cargo belum bayar tidak boleh masuk build-up outgoing.
   - Cargo incoming belum ada di storage tidak boleh dibuat DO.
   - Pieces dan weight build-up tidak boleh melebihi data timbang.
   - Semua void wajib alasan.

---

# G. Referensi Source Internal

Dokumen ini disusun berdasarkan referensi internal project, terutama:

- User Guide Penggunaan Aplikasi Warehouse Domestik.
- SOP Warehouse Export.
- SOP Warehouse Import.
- User Guide Warehouse International sebagai pembanding flow cargo.
- Referensi Cargo-IMP untuk konteks manifest, AWB/SMU, FFM, dan FHL.

