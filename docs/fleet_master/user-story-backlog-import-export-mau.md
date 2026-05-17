# User Story Siap Masuk Backlog — Operasional Import & Export Gudang MAU

Dokumen ini berisi contoh **user story backlog-ready** untuk pengembangan aplikasi operasional gudang MAU, khususnya proses **Import** dan **Export** cargo international.

Format ini bisa langsung dipindahkan ke Asana, Jira, GitLab Issues, atau backlog internal project.

---

## Keterangan Prioritas

| Prioritas | Keterangan                                                                                   |
| --------- | -------------------------------------------------------------------------------------------- |
| **MVP**   | Wajib tersedia pada release awal agar proses operasional utama bisa berjalan end-to-end.     |
| **R2**    | Release berikutnya; penting untuk kontrol, validasi lanjutan, audit, dan exception handling. |
| **R3**    | Otomasi/integrasi lanjutan; proses manual masih bisa berjalan tanpa fitur ini.               |

---

## Definition of Done Global

Setiap user story dianggap selesai apabila:

1. Form/input sudah tersedia sesuai kebutuhan user.
2. Validasi field wajib sudah berjalan.
3. Data tersimpan ke database dengan audit trail minimal: `created_by`, `created_at`, `updated_by`, `updated_at`.
4. Status transaksi berubah sesuai alur proses.
5. Data dapat dicari kembali melalui fitur search atau monitoring.
6. Jika story menghasilkan dokumen, sistem dapat melakukan preview/print/export PDF.
7. Role permission sudah diterapkan sesuai aktor pengguna.
8. Error message tampil jelas dan mudah dipahami user operasional.

---

# A. Backlog User Story — Import Cargo

## Epic IMP-FLT — Flight & Manifest Preparation

### IMP-001 — Input Flight Arrival

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** mencatat data flight kedatangan import,
- **Agar** proses penerimaan cargo dapat disiapkan berdasarkan airline, flight, tanggal, origin, dan jadwal kedatangan.

**Acceptance Criteria:**

1. User dapat input airline, flight number, flight date, origin station, ETA/ATA, aircraft registration, dan supervisor.
2. Sistem menolak penyimpanan jika airline, flight number, flight date, dan origin kosong.
3. Sistem dapat menampilkan daftar flight import berdasarkan tanggal.
4. Satu flight dapat memiliki banyak data MAWB/HAWB pada manifest.
5. Status awal flight tersimpan sebagai `scheduled` atau `arrived`.

---

### IMP-002 — Input Manifest Import Manual

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** menginput manifest import secara manual,
- **Agar** data MAWB/HAWB, jumlah koli, berat, dan nature of goods tersedia sebelum proses breakdown.

**Acceptance Criteria:**

1. User dapat memilih flight yang sudah dibuat.
2. User dapat input manifest number, MAWB, HAWB, origin, destination, pcs, weight, volume, nature of goods, dan consignee.
3. Sistem menghitung total pcs dan total weight per manifest.
4. Sistem menolak MAWB yang formatnya tidak valid sesuai pola prefix dan serial AWB.
5. Data manifest dapat dipakai sebagai referensi pada proses breakdown.

---

### IMP-003 — Upload Manifest dari File Excel/PDF

- **Prioritas:** R2
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** mengunggah file manifest dari airline atau ground handling,
- **Agar** data MAWB/HAWB tidak perlu diketik ulang satu per satu.

**Acceptance Criteria:**

1. User dapat upload file Excel atau PDF manifest.
2. Sistem membaca data utama: MAWB, HAWB, pcs, weight, origin, destination, consignee, dan nature of goods jika tersedia.
3. Sistem menampilkan preview sebelum data disimpan.
4. User dapat memperbaiki data hasil parsing sebelum submit.
5. Sistem mencatat nama file dan user yang melakukan upload.

---

### IMP-004 — Parse FFM Import

- **Prioritas:** R3
- **Aktor:** System Admin / EDI Operator
- **Sebagai** EDI Operator,
- **Saya ingin** sistem membaca pesan FFM,
- **Agar** manifest flight import dapat terbentuk otomatis dari pesan Cargo-IMP.

**Acceptance Criteria:**

1. User dapat paste atau upload pesan FFM.
2. Sistem membaca airline, flight number, date, origin, destination, ULD, MAWB, pcs, weight, dan nature of goods.
3. Sistem menampilkan error validasi jika struktur FFM tidak sesuai.
4. Data hasil parsing dapat disimpan sebagai manifest import.
5. Sistem menyimpan raw message untuk kebutuhan audit.

---

## Epic IMP-BRD — Receiving & Breakdown

### IMP-005 — Serah Terima Cargo dan Dokumen dari Ground Handling

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** mencatat serah terima cargo dan dokumen dari Ground Handling,
- **Agar** ada bukti penerimaan fisik cargo dan dokumen pendukung.

**Acceptance Criteria:**

1. User dapat memilih flight dan manifest.
2. User dapat input nama ground handling, waktu serah terima, petugas penyerah, dan petugas penerima.
3. User dapat mencatat dokumen yang diterima: manifest, MAWB, HAWB, dan dokumen pendukung lain.
4. Sistem dapat menghasilkan nomor tanda terima cargo dan dokumen.
5. Status flight berubah menjadi `cargo_received` jika serah terima selesai.

---

### IMP-006 — Buat Breakdown Cargo per Flight

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** membuat breakdown cargo berdasarkan manifest per flight,
- **Agar** cargo yang datang dapat dicocokkan antara data dokumen dan kondisi fisik.

**Acceptance Criteria:**

1. User dapat memilih flight, manifest number, airline, origin, dan supervisor.
2. User dapat input MAWB/HAWB, pcs manifest, pcs actual, weight manifest, weight actual, volume, ULD/cart, dan nature of goods.
3. Sistem menghitung selisih pcs dan weight antara manifest dan actual.
4. Sistem menghasilkan nomor breakdown setelah disimpan.
5. Data breakdown dapat dipakai oleh modul storage, NOA, D/O, dan invoice.

---

### IMP-007 — Validasi Fisik Cargo vs Manifest

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** sistem menampilkan perbedaan antara fisik cargo dan manifest,
- **Agar** irregularity seperti shortlanded, over, missing, atau damage bisa cepat terdeteksi.

**Acceptance Criteria:**

1. Sistem membandingkan pcs manifest dengan pcs actual.
2. Sistem membandingkan weight manifest dengan weight actual.
3. Jika ada selisih, sistem memberi tanda `discrepancy`.
4. User dapat memilih jenis discrepancy.
5. User dapat membuat laporan irregularity dari data discrepancy.

---

### IMP-008 — Catat ULD / Cart / Pallet Asal Cargo

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** mencatat ULD, cart, atau pallet asal cargo,
- **Agar** histori unloading dan sumber cargo dapat ditelusuri.

**Acceptance Criteria:**

1. User dapat input ULD number, cart number, atau pallet number pada detail breakdown.
2. Satu ULD/cart dapat memiliki banyak MAWB/HAWB.
3. Sistem menampilkan total pcs dan weight per ULD/cart.
4. Data ULD/cart dapat muncul di laporan cargo masuk.
5. User dapat mencari cargo berdasarkan ULD/cart.

---

### IMP-009 — Catat Cargo Damage

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** mencatat cargo damage saat breakdown,
- **Agar** kerusakan cargo terdokumentasi sejak awal penerimaan.

**Acceptance Criteria:**

1. User dapat memilih MAWB/HAWB dari breakdown.
2. User dapat input jenis damage, jumlah pcs rusak, berat, kronologi, dan keterangan.
3. User dapat upload foto damage.
4. Sistem menghasilkan nomor cargo damage report.
5. Status cargo berubah menjadi `damage_reported`.

---

### IMP-010 — Catat Irregularity Import

- **Prioritas:** MVP
- **Aktor:** Acceptance Checker
- **Sebagai** Acceptance Checker,
- **Saya ingin** membuat laporan irregularity import,
- **Agar** kejadian seperti shortlanded, over carried, missing, mislabeled, atau found cargo tercatat secara resmi.

**Acceptance Criteria:**

1. User dapat memilih jenis irregularity.
2. User dapat input airline, route, flight/date, supervisor, MAWB, HAWB, consignee, origin, pcs, weight, kind of goods, dan discrepancy.
3. Sistem dapat mengaitkan irregularity dengan flight dan breakdown.
4. Sistem menghasilkan nomor laporan irregularity.
5. Status irregularity awal adalah `draft` atau `submitted`.

---

## Epic IMP-STO — Storage & Location Control

### IMP-011 — Input Lokasi Cargo Import

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** memasukkan lokasi cargo hasil breakdown,
- **Agar** cargo mudah ditemukan saat proses document delivery dan release.

**Acceptance Criteria:**

1. User dapat mengambil data dari breakdown.
2. User dapat input MAWB, HAWB, part of, pcs, kind of goods, flight, location, date, dan time.
3. Sistem menolak input pcs lokasi yang melebihi pcs actual breakdown.
4. Sistem menyimpan histori lokasi cargo.
5. Status cargo berubah menjadi `stored`.

---

### IMP-012 — Relokasi Cargo Import

- **Prioritas:** R2
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** memindahkan lokasi cargo dari satu area ke area lain,
- **Agar** perubahan lokasi fisik tetap tercatat di sistem.

**Acceptance Criteria:**

1. User dapat memilih cargo berdasarkan MAWB/HAWB.
2. Sistem menampilkan lokasi lama.
3. User dapat input lokasi baru, pcs dipindahkan, alasan relokasi, dan waktu relokasi.
4. Sistem mencatat user yang melakukan relokasi.
5. Histori lokasi dapat dilihat kembali.

---

### IMP-013 — Cari Lokasi Cargo

- **Prioritas:** MVP
- **Aktor:** Storage Checker / Delivery Checker
- **Sebagai** Delivery Checker,
- **Saya ingin** mencari lokasi cargo berdasarkan MAWB, HAWB, DO, atau consignee,
- **Agar** proses pencarian barang di gudang lebih cepat.

**Acceptance Criteria:**

1. User dapat mencari cargo berdasarkan MAWB, HAWB, DO, flight, consignee, atau lokasi.
2. Sistem menampilkan pcs available, weight, location, storage type, dan status cargo.
3. Sistem menampilkan apakah cargo sudah punya D/O dan invoice.
4. Sistem menampilkan status customs clearance.
5. Data dapat diekspor ke Excel jika diperlukan.

---

### IMP-014 — Stock Report Import

- **Prioritas:** MVP
- **Aktor:** Supervisor / Storage Checker
- **Sebagai** Supervisor,
- **Saya ingin** melihat stock cargo import yang masih berada di gudang,
- **Agar** data sistem dapat dibandingkan dengan kondisi fisik.

**Acceptance Criteria:**

1. User dapat filter stock berdasarkan airline, flight, tanggal, MAWB, HAWB, consignee, dan lokasi.
2. Sistem menampilkan total pcs, total weight, dan total cargo per filter.
3. Cargo yang sudah released tidak muncul sebagai stock aktif.
4. Cargo bahandel/hold tetap muncul dengan status khusus.
5. Report dapat diekspor ke Excel/PDF.

---

### IMP-015 — Stock Opname Import

- **Prioritas:** R2
- **Aktor:** Supervisor / Storage Checker
- **Sebagai** Supervisor,
- **Saya ingin** melakukan stock opname cargo import,
- **Agar** data stock sistem dapat disesuaikan dengan kondisi fisik gudang.

**Acceptance Criteria:**

1. User dapat membuat sesi stock opname berdasarkan tanggal dan area/lokasi.
2. User dapat input MAWB, origin, flight date, BC 11, pos no, total HAWB, total gate in, total gate out, dan total overstay.
3. Sistem menampilkan selisih antara system stock dan physical stock.
4. Adjustment hanya dapat dilakukan oleh role yang berwenang.
5. Hasil stock opname dapat dicetak.

---

## Epic IMP-DOC — Document Process & Customs

### IMP-016 — Buat Notice of Arrival

- **Prioritas:** MVP
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** membuat Notice of Arrival berdasarkan MAWB yang sudah breakdown,
- **Agar** consignee atau agent dapat diberitahu bahwa barang sudah tiba.

**Acceptance Criteria:**

1. User dapat input MAWB untuk menarik data breakdown.
2. Sistem menolak pembuatan NOA jika MAWB belum breakdown.
3. NOA berisi data MAWB, HAWB jika ada, consignee, flight, arrival date, pcs, weight, dan nature of goods.
4. Sistem menghasilkan nomor NOA.
5. NOA dapat dicetak atau diunduh PDF.

---

### IMP-017 — Catat Pengiriman NOA

- **Prioritas:** R2
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** mencatat metode pengiriman NOA,
- **Agar** histori pemberitahuan kepada consignee dapat dibuktikan.

**Acceptance Criteria:**

1. User dapat memilih metode pengiriman: telepon, email, fax, WhatsApp, POS, atau manual.
2. User dapat input tanggal dan waktu pengiriman.
3. User dapat input nama penerima informasi.
4. Sistem menyimpan bukti pengiriman jika ada attachment.
5. Status NOA berubah menjadi `sent`.

---

### IMP-018 — Checklist Dokumen Import

- **Prioritas:** MVP
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** mencatat kelengkapan dokumen dari consignee/agent,
- **Agar** proses D/O dan release cargo tidak dilakukan tanpa dokumen yang sah.

**Acceptance Criteria:**

1. User dapat memilih MAWB/HAWB dan consignee.
2. Sistem menyediakan checklist dokumen: copy MAWB, HAWB, surat kuasa, KTP/ID, SPPB/SPBM, pecah PU jika ada, dan dokumen pendukung lain.
3. User dapat upload attachment dokumen.
4. Sistem menampilkan status dokumen `incomplete` atau `complete`.
5. D/O hanya dapat dibuat jika dokumen wajib sudah lengkap.

---

### IMP-019 — Proses Pecah PU

- **Prioritas:** MVP
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** mencatat proses pengajuan Pecah PU ke Bea Cukai,
- **Agar** MAWB consolidation dapat diproses per HAWB sesuai kebutuhan customs.

**Acceptance Criteria:**

1. User dapat memilih MAWB consolidation.
2. User dapat input jumlah HAWB, dokumen pendukung, tanggal pengajuan, dan petugas BC.
3. Sistem dapat mencatat nomor Pecah PU setelah diterbitkan.
4. Sistem menampilkan status `submitted`, `approved`, atau `rejected`.
5. Data Pecah PU dapat muncul di laporan bulanan.

---

### IMP-020 — Input SPPB/SPBM

- **Prioritas:** MVP
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** mencatat nomor SPPB/SPBM,
- **Agar** cargo hanya bisa keluar setelah dokumen customs clearance tersedia.

**Acceptance Criteria:**

1. User dapat input nomor SPPB atau SPBM untuk MAWB/HAWB.
2. User dapat upload dokumen SPPB/SPBM.
3. Sistem mencatat tanggal dokumen dan nama petugas input.
4. Cargo dengan status customs belum clear tidak dapat direlease.
5. Status customs berubah menjadi `cleared` jika SPPB/SPBM valid.

---

## Epic IMP-DO — Delivery Order

### IMP-021 — Buat Delivery Order Import

- **Prioritas:** MVP
- **Aktor:** Document Process Staff
- **Sebagai** Document Process Staff,
- **Saya ingin** membuat Delivery Order berdasarkan dokumen consignee dan data cargo,
- **Agar** consignee atau agent memiliki dokumen pengambilan cargo.

**Acceptance Criteria:**

1. User dapat input consignee dengan pencarian data customer.
2. User dapat memilih MAWB/HAWB yang sudah breakdown dan stored.
3. Sistem menolak D/O jika dokumen wajib belum lengkap.
4. Sistem menghasilkan nomor D/O.
5. D/O dapat dicetak dan status berubah menjadi `do_issued`.

---

### IMP-022 — Monitoring Delivery Order

- **Prioritas:** MVP
- **Aktor:** Supervisor / Document Process Staff
- **Sebagai** Supervisor,
- **Saya ingin** memonitor status D/O,
- **Agar** saya dapat mengetahui D/O yang belum dibayar, sudah dibayar, atau sudah release.

**Acceptance Criteria:**

1. User dapat filter D/O berdasarkan tanggal, MAWB, consignee, status, dan cashier.
2. Sistem menampilkan status: `issued`, `invoiced`, `paid`, `released`, atau `void`.
3. Sistem menampilkan nomor invoice jika sudah dibuat.
4. Sistem menampilkan waktu release jika cargo sudah keluar.
5. Data dapat diekspor ke Excel/PDF.

---

### IMP-023 — Void Delivery Order

- **Prioritas:** R2
- **Aktor:** Supervisor / Document Process Staff
- **Sebagai** Supervisor,
- **Saya ingin** membatalkan D/O yang salah,
- **Agar** dokumen pengeluaran cargo yang tidak valid tidak bisa digunakan.

**Acceptance Criteria:**

1. User dapat input nomor D/O yang akan divoid.
2. Sistem menampilkan detail D/O sebelum void.
3. User wajib input alasan void.
4. D/O tidak dapat divoid jika cargo sudah released, kecuali role khusus.
5. Sistem menyimpan audit trail void.

---

## Epic IMP-CAS — Cashier Import

### IMP-024 — Buat Invoice Import

- **Prioritas:** MVP
- **Aktor:** Cashier
- **Sebagai** Cashier,
- **Saya ingin** membuat invoice import berdasarkan MAWB dan D/O,
- **Agar** biaya sewa gudang dan biaya terkait tercatat sebelum cargo keluar.

**Acceptance Criteria:**

1. User dapat memilih type agreement dan type pembayaran: cash, credit, atau deposit.
2. User dapat input MAWB, nomor D/O, nomor SPPB/SPBM, dan master AWB/host.
3. Sistem menarik data cargo, consignee, storage, pcs, weight, dan durasi storage.
4. Sistem menghitung biaya sesuai tariff master.
5. Sistem menghasilkan nomor invoice dan dapat mencetak invoice.

---

### IMP-025 — Konfirmasi Pembayaran Invoice Import

- **Prioritas:** MVP
- **Aktor:** Cashier
- **Sebagai** Cashier,
- **Saya ingin** mengonfirmasi pembayaran invoice,
- **Agar** cargo yang sudah dibayar dapat diproses release.

**Acceptance Criteria:**

1. User dapat memilih invoice yang belum dibayar.
2. User dapat input metode pembayaran dan nominal diterima.
3. Sistem menolak pembayaran jika nominal kurang dari total invoice, kecuali ada approval credit/deposit.
4. Status invoice berubah menjadi `paid`.
5. Status D/O berubah menjadi `ready_to_release`.

---

### IMP-026 — Rekap Invoice Import per Shift

- **Prioritas:** MVP
- **Aktor:** Cashier / Finance
- **Sebagai** Cashier,
- **Saya ingin** melihat rekap invoice import per shift,
- **Agar** saya dapat mencocokkan invoice yang diterbitkan dengan uang yang diterima.

**Acceptance Criteria:**

1. User dapat filter berdasarkan tanggal, shift, cashier, dan payment type.
2. Sistem menampilkan daftar invoice, total amount, paid amount, dan void amount.
3. Sistem menampilkan subtotal per payment type.
4. Report dapat dicetak dan diekspor.
5. Data yang sudah closing finance tidak dapat diubah oleh cashier.

---

### IMP-027 — Void Invoice Import

- **Prioritas:** R2
- **Aktor:** Cashier / Supervisor
- **Sebagai** Cashier,
- **Saya ingin** membatalkan invoice import yang salah,
- **Agar** transaksi keuangan tetap akurat.

**Acceptance Criteria:**

1. User dapat input nomor invoice yang akan divoid.
2. Sistem menampilkan detail invoice.
3. User wajib input alasan void.
4. Invoice tidak dapat divoid jika sudah closing finance, kecuali role supervisor/finance.
5. Sistem mengembalikan status D/O sesuai kondisi sebelum invoice dibuat.

---

## Epic IMP-REL — Cargo Release & Proof of Delivery

### IMP-028 — Release Cargo Import

- **Prioritas:** MVP
- **Aktor:** Delivery Checker
- **Sebagai** Delivery Checker,
- **Saya ingin** memvalidasi D/O, pembayaran, customs clearance, dan lokasi cargo,
- **Agar** cargo yang keluar benar dan sudah memenuhi syarat dokumen.

**Acceptance Criteria:**

1. User dapat scan/input nomor D/O.
2. Sistem menampilkan MAWB/HAWB, consignee, lokasi, pcs, weight, invoice, dan status customs.
3. Sistem menolak release jika invoice belum paid atau customs belum clear.
4. User dapat input pcs yang dikeluarkan dan nama penerima.
5. Status cargo berubah menjadi `released` dan stock berkurang.

---

### IMP-029 — Buat Proof of Delivery / Surat Jalan

- **Prioritas:** MVP
- **Aktor:** Delivery Checker
- **Sebagai** Delivery Checker,
- **Saya ingin** membuat Proof of Delivery atau surat jalan,
- **Agar** serah terima cargo kepada consignee/agent memiliki bukti dokumen.

**Acceptance Criteria:**

1. User dapat membuat POD berdasarkan nomor invoice atau D/O.
2. Sistem menampilkan data cargo, consignee, invoice, pcs, weight, dan lokasi.
3. User dapat input nama penerima, nomor identitas, kendaraan, dan waktu pengambilan.
4. POD dapat dicetak.
5. Sistem menyimpan status `pod_printed`.

---

### IMP-030 — Cargo Out Report Import

- **Prioritas:** MVP
- **Aktor:** Supervisor / Delivery Checker
- **Sebagai** Supervisor,
- **Saya ingin** melihat laporan cargo keluar import,
- **Agar** stock dan aktivitas pengeluaran barang dapat dimonitor per shift.

**Acceptance Criteria:**

1. User dapat filter laporan berdasarkan tanggal, shift, DO, MAWB, consignee, dan airline.
2. Sistem menampilkan HAWB, pieces, netto, volume, CAW/RH, time, dan kind of goods.
3. Data cargo yang keluar otomatis mengurangi stock.
4. Report dapat diekspor ke Excel/PDF.
5. Report hanya menampilkan cargo dengan status `released`.

---

### IMP-031 — Handling Bahandel / Cargo Hold

- **Prioritas:** R2
- **Aktor:** Supervisor / Storage Checker
- **Sebagai** Supervisor,
- **Saya ingin** menandai cargo sebagai bahandel atau hold,
- **Agar** cargo yang bermasalah tidak dapat keluar sebelum statusnya diselesaikan.

**Acceptance Criteria:**

1. User dapat memilih MAWB/HAWB yang akan ditandai hold/bahandel.
2. User wajib input alasan hold.
3. Cargo dengan status hold tidak dapat dibuat POD atau release.
4. Hanya role supervisor yang dapat melepas status hold.
5. Sistem menyimpan histori hold dan release hold.

---

### IMP-032 — Rush Handling Import

- **Prioritas:** R2
- **Aktor:** Rush Handling Staff
- **Sebagai** Rush Handling Staff,
- **Saya ingin** mencatat proses rush handling untuk cargo khusus,
- **Agar** cargo seperti perishable, live animal, human remain, diplomatic mail, atau live human organ dapat diproses cepat namun tetap terdokumentasi.

**Acceptance Criteria:**

1. User dapat memilih cargo yang termasuk special/rush handling.
2. Sistem wajib mencatat approval customs jika diperlukan.
3. User dapat membuat delivery bill atau biaya rush handling.
4. Sistem dapat mencetak surat jalan rush.
5. Status cargo berubah menjadi `rush_released` setelah proses selesai.

---

# B. Backlog User Story — Export Cargo

## Epic EXP-BKG — Booking & Acceptance Approval

### EXP-001 — Input Booking Status MAWB/HAWB

- **Prioritas:** MVP
- **Aktor:** Movement Control Staff
- **Sebagai** Movement Control Staff,
- **Saya ingin** mencatat booking status dari airline,
- **Agar** cargo export yang masuk gudang dapat divalidasi terhadap space penerbangan yang tersedia.

**Acceptance Criteria:**

1. User dapat input airline, MAWB, HAWB, destination, flight number, flight date, booking status, dan allotment/space.
2. Sistem menolak acceptance jika MAWB belum memiliki booking status, kecuali ada override supervisor.
3. User dapat update booking status jika ada perubahan dari airline.
4. Sistem menyimpan histori perubahan booking.
5. Booking dapat dicari berdasarkan MAWB, airline, flight, dan destination.

---

### EXP-002 — Acceptance Approval Export

- **Prioritas:** MVP
- **Aktor:** Acceptance Staff
- **Sebagai** Acceptance Staff,
- **Saya ingin** menyimpan data MAWB/HAWB yang akan ditimbang,
- **Agar** cargo export memiliki data awal sebelum proses weighing dan customs.

**Acceptance Criteria:**

1. User dapat input MAWB, HAWB, tanggal masuk, koli, total koli, shipper, agent, consignee, PIC shipper, telepon shipper, destination, nature of goods, HS code, dan special handling.
2. Sistem menolak penyimpanan jika MAWB, shipper, destination, pcs, dan nature of goods kosong.
3. Sistem dapat menarik data customer dari master customer.
4. Sistem dapat menandai cargo special handling.
5. Data acceptance approval dapat dipakai oleh CWP/BTB export.

---

### EXP-003 — Validasi Dokumen Export

- **Prioritas:** MVP
- **Aktor:** Acceptance Staff
- **Sebagai** Acceptance Staff,
- **Saya ingin** memvalidasi dokumen export,
- **Agar** cargo yang diterima sudah memenuhi persyaratan dokumen sebelum masuk proses timbang.

**Acceptance Criteria:**

1. Sistem menyediakan checklist dokumen: MAWB/HAWB, SLI, packing list, invoice, shipper letter of DGR jika dangerous goods, dan dokumen tambahan lain.
2. User dapat upload attachment dokumen.
3. Sistem menampilkan status dokumen `complete` atau `incomplete`.
4. Cargo tidak dapat dilanjutkan ke weighing jika dokumen wajib belum lengkap.
5. Supervisor dapat memberikan override dengan alasan.

---

### EXP-004 — Validasi Isi Kiriman dan Special Handling

- **Prioritas:** MVP
- **Aktor:** Acceptance Staff
- **Sebagai** Acceptance Staff,
- **Saya ingin** mencatat jenis isi kiriman dan special handling,
- **Agar** barang yang dilarang, dangerous goods, atau barang khusus dapat ditangani sesuai aturan.

**Acceptance Criteria:**

1. User dapat memilih cargo type: general cargo, dangerous goods, perishable, live animal, valuable, human remain, strong smelling goods, dan lainnya.
2. Sistem meminta dokumen tambahan jika cargo type membutuhkan dokumen khusus.
3. Sistem menandai special handling code pada MAWB/HAWB.
4. Sistem dapat memberi warning jika cargo type tidak sesuai flight/airline.
5. Data special handling muncul pada storage, build-up, manifest, dan NOTOC jika diperlukan.

---

### EXP-005 — Validasi Packing dan Label

- **Prioritas:** MVP
- **Aktor:** Acceptance Staff
- **Sebagai** Acceptance Staff,
- **Saya ingin** mencatat hasil pemeriksaan packing dan label,
- **Agar** setiap koli memiliki identitas dan kondisi packing yang layak sebelum masuk gudang.

**Acceptance Criteria:**

1. User dapat mencatat kondisi packing: good, torn, wet, broken, leaking, atau not accepted.
2. User dapat mencatat label AWB, destination, transfer station, number of piece, dan label special handling.
3. Sistem menolak acceptance jika packing dinyatakan `not accepted`, kecuali ada approval supervisor.
4. User dapat upload foto packing jika ada masalah.
5. Sistem menyimpan hasil pemeriksaan packing dan label pada detail acceptance.

---

## Epic EXP-WGH — Weighing, Dimension & CWP/BTB

### EXP-006 — Buat Cargo Weighing Proof Export

- **Prioritas:** MVP
- **Aktor:** Acceptance Scale Staff
- **Sebagai** Acceptance Scale Staff,
- **Saya ingin** membuat Cargo Weighing Proof export,
- **Agar** berat aktual cargo export tercatat sebelum pembayaran dan proses customs/export.

**Acceptance Criteria:**

1. User dapat input MAWB yang sudah ada di acceptance approval dan booking list.
2. Sistem menarik data shipper, agent, consignee, destination, nature of goods, dan special handling.
3. Sistem membaca berat dari timbangan jika tersedia.
4. User dapat input pcs, pallet weight, dan gross weight.
5. Sistem menghasilkan nomor CWP/BTB export dan dapat mencetak dokumen.

---

### EXP-007 — Input Dimensi dan Volume Export

- **Prioritas:** MVP
- **Aktor:** Acceptance Scale Staff
- **Sebagai** Acceptance Scale Staff,
- **Saya ingin** menginput dimensi cargo export,
- **Agar** sistem dapat menghitung volume weight dan chargeable weight.

**Acceptance Criteria:**

1. User dapat mencari nomor CWP/BTB.
2. User dapat input HAWB, pieces, length, width, height, dan jumlah koli untuk dimensi tersebut.
3. Sistem mendukung multi-volume untuk satu MAWB.
4. Sistem menghitung volume weight.
5. Sistem menentukan chargeable weight dari nilai terbesar antara actual weight dan volume weight.

---

### EXP-008 — Monitoring CWP Export Belum Bayar

- **Prioritas:** MVP
- **Aktor:** Cashier / Supervisor
- **Sebagai** Supervisor,
- **Saya ingin** memonitor CWP export yang belum melakukan pembayaran,
- **Agar** cargo belum dibayar tidak lanjut ke proses berikutnya tanpa kontrol.

**Acceptance Criteria:**

1. Sistem menampilkan daftar CWP/BTB yang belum memiliki invoice/payment.
2. User dapat filter berdasarkan tanggal, airline, shipper, MAWB, dan flight.
3. Sistem menampilkan pcs, weight, CAW, dan total estimasi biaya.
4. Data hilang dari monitoring setelah invoice paid.
5. Report dapat diekspor ke Excel.

---

### EXP-009 — Void CWP Export

- **Prioritas:** R2
- **Aktor:** Supervisor / Acceptance Staff
- **Sebagai** Supervisor,
- **Saya ingin** membatalkan CWP export yang salah,
- **Agar** data timbang yang tidak valid tidak dipakai untuk invoice atau build-up.

**Acceptance Criteria:**

1. User dapat input nomor CWP/BTB yang akan divoid.
2. Sistem menampilkan detail CWP sebelum void.
3. User wajib input alasan void.
4. CWP tidak dapat divoid jika sudah invoiced/paid atau built-up, kecuali role khusus.
5. Sistem menyimpan audit trail void.

---

## Epic EXP-CUS — Customs & Export Clearance

### EXP-010 — Input Nomor PEB/PEN/KTKR

- **Prioritas:** MVP
- **Aktor:** Acceptance Staff / Document Export Staff
- **Sebagai** Document Export Staff,
- **Saya ingin** mencatat nomor PEB/PEN/KTKR dan tanggal pendaftaran,
- **Agar** dokumen customs export terhubung dengan MAWB/HAWB dan CWP/BTB.

**Acceptance Criteria:**

1. User dapat input nomor PEB, PEN, KTKR, tanggal pendaftaran, dan status customs.
2. Data dapat dihubungkan ke MAWB/HAWB dan CWP/BTB.
3. Sistem meminta upload dokumen pendukung.
4. Sistem menampilkan status `waiting_customs`, `approved`, atau `rejected`.
5. Cargo tidak dapat masuk status siap export jika customs belum approved.

---

### EXP-011 — Tandai Cargo Siap Export

- **Prioritas:** MVP
- **Aktor:** Document Export Staff
- **Sebagai** Document Export Staff,
- **Saya ingin** menandai cargo sebagai siap export setelah customs clearance selesai,
- **Agar** cargo dapat dilanjutkan ke storage/build-up.

**Acceptance Criteria:**

1. User dapat memilih MAWB/HAWB yang sudah memiliki CWP/BTB dan dokumen customs.
2. User dapat input tanggal customs clear dan petugas input.
3. Sistem mewajibkan dokumen PEB/PEN/KTKR atau dokumen setuju export sesuai flow yang dipakai.
4. Status cargo berubah menjadi `ready_for_export`.
5. Data siap export muncul pada stock report export.

---

### EXP-012 — File Dokumen Export

- **Prioritas:** R2
- **Aktor:** Document Export Staff
- **Sebagai** Document Export Staff,
- **Saya ingin** menyimpan salinan dokumen export,
- **Agar** dokumen MAWB, manifest, BTB, dan customs dapat ditelusuri kembali.

**Acceptance Criteria:**

1. User dapat upload file MAWB, HAWB, manifest, BTB, PEB, invoice, packing list, dan dokumen lain.
2. File tersimpan berdasarkan nomor MAWB/HAWB.
3. User dapat preview dan download attachment.
4. Sistem mencatat uploader dan waktu upload.
5. File tidak dapat dihapus tanpa permission khusus.

---

## Epic EXP-CAS — Cashier Export

### EXP-013 — Buat Invoice Export

- **Prioritas:** MVP
- **Aktor:** Cashier
- **Sebagai** Cashier,
- **Saya ingin** membuat invoice export berdasarkan CWP/BTB,
- **Agar** biaya sewa gudang dan biaya layanan export tercatat sebelum cargo diproses lanjut.

**Acceptance Criteria:**

1. User dapat input nomor CWP/BTB.
2. Sistem menarik data shipper, MAWB, HAWB, pcs, actual weight, volume weight, dan chargeable weight.
3. Sistem menghitung biaya berdasarkan tariff master.
4. User dapat memilih payment type: cash, credit, atau deposit.
5. Sistem menghasilkan nomor invoice/official receipt dan dapat mencetak dokumen.

---

### EXP-014 — Konfirmasi Pembayaran Invoice Export

- **Prioritas:** MVP
- **Aktor:** Cashier
- **Sebagai** Cashier,
- **Saya ingin** mengonfirmasi pembayaran invoice export,
- **Agar** cargo yang sudah dibayar dapat masuk ke stock siap build-up.

**Acceptance Criteria:**

1. User dapat memilih invoice export yang belum dibayar.
2. User dapat input metode pembayaran dan nominal diterima.
3. Sistem menolak pembayaran kurang dari total tagihan kecuali ada approval credit/deposit.
4. Status invoice berubah menjadi `paid`.
5. Status cargo berubah menjadi `paid_ready_for_storage` atau `ready_for_build_up` sesuai konfigurasi flow.

---

### EXP-015 — Rekap Invoice Export per Shift

- **Prioritas:** MVP
- **Aktor:** Cashier / Finance
- **Sebagai** Cashier,
- **Saya ingin** melihat rekap invoice export per shift,
- **Agar** transaksi pembayaran export dapat direkonsiliasi dengan uang yang diterima.

**Acceptance Criteria:**

1. User dapat filter berdasarkan tanggal, shift, cashier, payment type, airline, dan shipper.
2. Sistem menampilkan daftar invoice, total amount, paid amount, dan void amount.
3. Sistem menampilkan subtotal per payment type.
4. Report dapat dicetak dan diekspor.
5. Data yang sudah closing finance tidak dapat diubah oleh cashier.

---

### EXP-016 — Void Invoice Export

- **Prioritas:** R2
- **Aktor:** Cashier / Supervisor
- **Sebagai** Supervisor,
- **Saya ingin** membatalkan invoice export yang salah,
- **Agar** transaksi finance tidak mencatat tagihan yang tidak valid.

**Acceptance Criteria:**

1. User dapat input nomor invoice export yang akan divoid.
2. Sistem menampilkan detail invoice.
3. User wajib input alasan void.
4. Invoice tidak dapat divoid jika sudah closing finance, kecuali role khusus.
5. Sistem menyimpan audit trail dan mengembalikan status cargo ke kondisi sebelum invoice.

---

## Epic EXP-STO — Export Storage & Stock

### EXP-017 — Stock Report Export Siap Build-Up

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** melihat daftar cargo export yang sudah siap build-up,
- **Agar** cargo dapat dikelompokkan berdasarkan airline, tujuan, dan flight.

**Acceptance Criteria:**

1. User dapat filter stock berdasarkan tanggal, airline, destination, flight number, MAWB, dan status payment.
2. Sistem hanya menampilkan cargo yang sudah memenuhi syarat sesuai konfigurasi: paid, customs clear, atau ready export.
3. Sistem menampilkan pcs, weight, volume, CAW, nature of goods, dan special handling.
4. Cargo yang sudah built-up tidak muncul pada stock aktif.
5. Report dapat diekspor ke Excel/PDF.

---

### EXP-018 — Input Lokasi Penimbunan Export

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** mencatat lokasi sementara cargo export,
- **Agar** cargo yang sudah ditimbang dan menunggu build-up dapat ditemukan dengan mudah.

**Acceptance Criteria:**

1. User dapat memilih MAWB/HAWB dari CWP/BTB.
2. User dapat input lokasi, pcs, weight, storage type, date, dan time.
3. Sistem menyimpan histori lokasi cargo.
4. Sistem menolak pcs lokasi yang melebihi pcs CWP/BTB.
5. Lokasi muncul pada stock report export.

---

## Epic EXP-BLD — Build-Up, ULD & Manifest

### EXP-019 — Buat Build-Up Planning

- **Prioritas:** MVP
- **Aktor:** Storage Checker / Movement Control
- **Sebagai** Storage Checker,
- **Saya ingin** membuat rencana build-up berdasarkan flight dan instruksi airline,
- **Agar** cargo dapat disiapkan sesuai planning sebelum diserahkan ke Ground Handling.

**Acceptance Criteria:**

1. User dapat memilih airline, destination, flight number, flight date, dan build-up area.
2. User dapat memilih cargo dari stock export siap build-up.
3. Sistem menampilkan total pcs, weight, dan volume planning.
4. User dapat menentukan ULD/pallet/container yang akan digunakan.
5. Status planning tersimpan sebagai `draft` atau `ready_for_build_up`.

---

### EXP-020 — Proses Cargo Build-Up

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** menginput cargo yang sudah dibuild-up,
- **Agar** data cargo yang masuk ULD/pallet/container tercatat akurat.

**Acceptance Criteria:**

1. User dapat memilih build-up planning.
2. User dapat input MAWB/HAWB, pcs built-up, weight, ULD number, dan remarks.
3. Sistem menolak pcs built-up yang melebihi stock available.
4. Sistem mengurangi stock export available.
5. Status cargo berubah menjadi `built_up`.

---

### EXP-021 — Buat Loading Checklist

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** membuat loading checklist,
- **Agar** cargo yang akan dimuat ke pesawat dapat diverifikasi ulang sebelum handover ke Ground Handling.

**Acceptance Criteria:**

1. Sistem membuat loading checklist dari data build-up.
2. Checklist menampilkan flight, ULD, MAWB/HAWB, pcs, weight, destination, dan special handling.
3. User dapat mencatat hasil pengecekan final.
4. Checklist dapat dicetak.
5. Checklist tersimpan sebagai dokumen operasional.

---

### EXP-022 — Timbang ULD dan Cetak Label ULD

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** mencatat berat ULD setelah build-up,
- **Agar** total berat per ULD dapat digunakan untuk manifest dan handover.

**Acceptance Criteria:**

1. User dapat memilih ULD dari build-up.
2. Sistem menampilkan total pcs dan estimated weight dari cargo yang masuk ULD.
3. User dapat input gross weight ULD hasil timbang.
4. Sistem menyimpan tare weight jika tersedia.
5. Label ULD dapat dicetak.

---

### EXP-023 — Buat NOTOC

- **Prioritas:** R2
- **Aktor:** Storage Checker / Supervisor
- **Sebagai** Supervisor,
- **Saya ingin** membuat NOTOC untuk cargo yang membutuhkan pemberitahuan ke captain,
- **Agar** special cargo atau dangerous goods dapat dilaporkan sesuai aturan penerbangan.

**Acceptance Criteria:**

1. Sistem menampilkan cargo special handling yang memerlukan NOTOC.
2. User dapat input detail special cargo, ULD, posisi, pcs, weight, dan remarks.
3. NOTOC dapat dicetak.
4. Sistem menolak NOTOC jika data special cargo tidak lengkap.
5. NOTOC tersimpan pada arsip flight/export manifest.

---

### EXP-024 — Buat Export Manifest

- **Prioritas:** MVP
- **Aktor:** Storage Checker / Document Export Staff
- **Sebagai** Document Export Staff,
- **Saya ingin** membuat manifest cargo export berdasarkan data build-up,
- **Agar** data cargo yang diserahkan ke airline dan Ground Handling tercatat lengkap.

**Acceptance Criteria:**

1. Sistem membuat manifest berdasarkan flight dan build-up.
2. Manifest menampilkan airline, flight, date, destination, ULD, MAWB/HAWB, pcs, weight, dan nature of goods.
3. User dapat melakukan review sebelum final print.
4. Manifest dapat dicetak dan diekspor PDF/Excel.
5. Setelah final, status manifest berubah menjadi `finalized`.

---

### EXP-025 — Handover Cargo ke Ground Handling

- **Prioritas:** MVP
- **Aktor:** Storage Checker
- **Sebagai** Storage Checker,
- **Saya ingin** mencatat serah terima cargo export ke Ground Handling,
- **Agar** ada bukti bahwa cargo sudah keluar dari gudang menuju aircraft handling.

**Acceptance Criteria:**

1. User dapat memilih flight dan manifest final.
2. User dapat input nama Ground Handling, petugas penerima, waktu serah terima, dan remarks.
3. Sistem menampilkan total ULD, total pcs, dan total weight yang diserahkan.
4. Sistem menghasilkan cargo delivery/handover document.
5. Status cargo berubah menjadi `handed_over_to_gha`.

---

### EXP-026 — Catat Cargo Offload

- **Prioritas:** R2
- **Aktor:** Storage Checker / Supervisor
- **Sebagai** Storage Checker,
- **Saya ingin** mencatat cargo yang offload,
- **Agar** cargo yang tidak jadi diberangkatkan dapat dikembalikan ke stock atau diproses ulang.

**Acceptance Criteria:**

1. User dapat memilih flight, ULD, dan MAWB/HAWB yang offload.
2. User wajib input alasan offload.
3. Sistem mengembalikan pcs/weight ke stock export jika cargo kembali ke gudang.
4. Sistem membuat laporan irregularity/offload.
5. Status cargo berubah menjadi `offloaded`.

---

## Epic EXP-MOV — Movement Control

### EXP-027 — Collect Daily Reservation dari Airline

- **Prioritas:** R2
- **Aktor:** Movement Control Staff
- **Sebagai** Movement Control Staff,
- **Saya ingin** mencatat daily reservation dari airline,
- **Agar** rencana cargo berangkat dapat dimonitor satu hari sebelum flight.

**Acceptance Criteria:**

1. User dapat input airline, flight, date, destination, reservation number, MAWB, pcs, dan estimated weight.
2. Sistem dapat menandai reservation sebagai confirmed, waiting, cancelled, atau changed.
3. User dapat upload dokumen reservation dari airline.
4. Data reservation dapat dibandingkan dengan cargo yang benar-benar masuk gudang.
5. Report reservation tersedia per airline dan date.

---

### EXP-028 — Update Booking Status

- **Prioritas:** R2
- **Aktor:** Movement Control Staff
- **Sebagai** Movement Control Staff,
- **Saya ingin** memperbarui booking status jika ada perubahan dari airline,
- **Agar** acceptance, storage, dan build-up memakai data flight yang terbaru.

**Acceptance Criteria:**

1. User dapat mengubah status booking.
2. Sistem mencatat status lama, status baru, user, waktu, dan alasan perubahan.
3. Jika flight berubah, sistem memberi warning ke acceptance/storage.
4. Jika booking cancelled, sistem menandai cargo terkait sebagai `booking_cancelled`.
5. Histori booking dapat dilihat kembali.

---

## Epic EXP-EDI — EDI & Reporting Export

### EXP-029 — Generate FWB/FHL/FFM Export

- **Prioritas:** R3
- **Aktor:** EDI Operator
- **Sebagai** EDI Operator,
- **Saya ingin** menghasilkan pesan FWB, FHL, atau FFM dari data export,
- **Agar** data AWB, house, dan manifest dapat dikirim secara elektronik ke airline atau sistem terkait.

**Acceptance Criteria:**

1. Sistem dapat membuat FWB dari data MAWB/AWB.
2. Sistem dapat membuat FHL dari data HAWB/consolidation.
3. Sistem dapat membuat FFM dari data manifest flight dan build-up.
4. Sistem melakukan validasi format sebelum message final.
5. Raw message dapat disimpan, diunduh, dan ditransmit jika integrasi tersedia.

---

### EXP-030 — Laporan Harian Cargo Export

- **Prioritas:** MVP
- **Aktor:** Supervisor / Movement Control Staff
- **Sebagai** Supervisor,
- **Saya ingin** membuat laporan harian cargo export,
- **Agar** total cargo berangkat, cargo pending, offload, dan revenue dapat dimonitor.

**Acceptance Criteria:**

1. User dapat filter berdasarkan tanggal, shift, airline, flight, destination, dan status cargo.
2. Sistem menampilkan total MAWB, HAWB, pcs, weight, volume, CAW, dan total invoice.
3. Sistem menampilkan cargo pending dan offload.
4. Report dapat dicetak dan diekspor.
5. Report dapat digunakan untuk serah terima shift.

---

### EXP-031 — Laporan Irregularity Export

- **Prioritas:** R2
- **Aktor:** Supervisor
- **Sebagai** Supervisor,
- **Saya ingin** mencatat dan melaporkan irregularity export,
- **Agar** kejadian seperti offload, damage, missing, salah label, atau cargo tertinggal dapat ditindaklanjuti.

**Acceptance Criteria:**

1. User dapat memilih jenis irregularity export.
2. User dapat input airline, flight, date, MAWB/HAWB, pcs, weight, kronologi, dan penyebab sementara.
3. User dapat upload dokumen pendukung seperti manifest, BTB/CWP, loading checklist, dan handover document.
4. Sistem menghasilkan nomor laporan irregularity.
5. Status laporan dapat berubah menjadi `submitted`, `approved`, `closed`.

---

# C. Rekomendasi Urutan Implementasi

## Release 1 — MVP End-to-End

### Import

1. Flight Arrival
2. Manifest Manual
3. Serah Terima Cargo & Docs
4. Breakdown
5. Location
6. Stock Report
7. NOA
8. Document Checklist
9. SPPB/SPBM
10. Delivery Order
11. Invoice Import
12. Payment Confirmation
13. Cargo Release
14. POD / Surat Jalan
15. Cargo Out Report

### Export

1. Booking Status
2. Acceptance Approval
3. Validasi Dokumen Export
4. Packing & Label Check
5. CWP/BTB Export
6. Dimension/Volume
7. Invoice Export
8. Payment Confirmation
9. Export Stock Ready Build-Up
10. Build-Up Planning
11. Cargo Build-Up
12. Loading Checklist
13. ULD Weight & Label
14. Export Manifest
15. Handover to Ground Handling
16. Daily Export Report

---

## Release 2 — Control, Audit, Exception

### Import

1. Upload Manifest File
2. Relocation Cargo
3. Stock Opname
4. Pengiriman NOA
5. Pecah PU detail
6. Void D/O
7. Void Invoice
8. Bahandel / Cargo Hold
9. Rush Handling
10. Approval Irregularity

### Export

1. Void CWP
2. File Dokumen Export
3. Void Invoice Export
4. NOTOC
5. Cargo Offload
6. Daily Reservation
7. Update Booking Status
8. Irregularity Export

---

## Release 3 — Integration & Automation

1. Parse FFM Import
2. Generate FWB/FHL/FFM Export
3. Barcode/QR scanning MAWB, HAWB, D/O, CWP, dan ULD
4. WhatsApp/email notification untuk NOA
5. Integrasi timbangan otomatis
6. Integrasi CEISA/TPS/HUBNET/AP2 bila dibutuhkan
7. Dashboard KPI import/export

---

# D. Catatan untuk Developer

Status penting yang disarankan:

```text
scheduled
arrived
cargo_received
manifest_created
breakdown_done
stored
docs_incomplete
docs_complete
customs_waiting
customs_cleared
do_issued
invoice_created
paid
ready_to_release
released
pod_printed
ready_for_export
paid_ready_for_storage
ready_for_build_up
built_up
manifest_finalized
handed_over_to_gha
offloaded
void
hold
irregularity
```

Role awal yang disarankan:

```text
admin
supervisor
acceptance_checker
storage_checker
document_staff
cashier
delivery_checker
movement_control
edi_operator
finance
```
