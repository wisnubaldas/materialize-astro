Siap mas ganteng. Dari struktur sekarang, alurnya kelihatan begini:

- `build_up_check_header` = 1 ULD / flight / tanggal.
- `build_up_check_detail` = 1 Master AWB di dalam 1 ULD.
- `build_up_check_rincian` = input aktual pieces/weight untuk Master AWB tersebut.

Jadi kalau **1 Master AWB tersebar ke 2 ULD**, secara data sebaiknya muncul sebagai **2 row di `build_up_check_detail`**, masing-masing di bawah `header_id` ULD yang berbeda, dengan `mawb` yang sama.

**Rekomendasi Best Practice**
Jangan hanya tambah kolom boolean seperti `is_split_uld` lalu diisi manual dari mobile. Itu rawan tidak sinkron. Best practice-nya: status split dihitung atau dikontrol oleh backend berdasarkan data existing.

Rekomendasi skema minimal yang aman:

```sql
ALTER TABLE build_up_check_detail
ADD COLUMN master_total_pieces INT NULL AFTER total_pieces,
ADD COLUMN split_group_key VARCHAR(150) NULL AFTER master_total_pieces,
ADD COLUMN split_sequence SMALLINT NULL AFTER split_group_key,
ADD COLUMN split_total_uld SMALLINT NOT NULL DEFAULT 1 AFTER split_sequence,
ADD COLUMN is_split_uld TINYINT(1) NOT NULL DEFAULT 0 AFTER split_total_uld;
```

Makna kolom:

- `total_pieces`
  Tetap dipakai sebagai **pieces yang dialokasikan ke ULD ini**.
- `master_total_pieces`
  Total pieces asli dari Master AWB, jika diketahui.
- `split_group_key`
  Kunci grouping, misalnya gabungan `flight_no + flight_date + mawb`.
- `split_sequence`
  Urutan ULD untuk MAWB tersebut, contoh ULD pertama = `1`, ULD kedua = `2`.
- `split_total_uld`
  Jumlah ULD tempat MAWB ini tersebar.
- `is_split_uld`
  Flag cepat untuk UI/report bahwa MAWB ini tersebar ke lebih dari satu ULD.

Tapi catatan penting: `is_split_uld`, `split_sequence`, dan `split_total_uld` sebaiknya **di-update oleh backend service**, bukan diinput manual oleh mobile.

**Alur Backend yang Disarankan**
Saat mobile menambahkan Master AWB ke ULD:

1. Backend terima `header_id`, `mawb`, `total_pieces`, optional `master_total_pieces`.
2. Backend cek data existing:
   - MAWB sama
   - flight sama
   - tanggal flight sama
   - ULD berbeda
3. Jika ditemukan di ULD lain:
   - set semua row MAWB tersebut menjadi `is_split_uld = 1`
   - isi `split_group_key`
   - update `split_total_uld`
   - update `split_sequence`
4. Response ke mobile membawa info:
   - `is_split_uld`
   - `split_total_uld`
   - daftar ULD terkait jika perlu.

**Index yang Disarankan**
Agar lookup split cepat:

```sql
CREATE INDEX ix_build_up_check_detail_mawb_header
ON build_up_check_detail (mawb, header_id);

CREATE INDEX ix_build_up_check_detail_split_group
ON build_up_check_detail (split_group_key);
```

Kalau query sering berdasarkan flight/date, karena datanya ada di `header`, backend akan join ke `build_up_check_header`. Idealnya tambahkan query repository yang join `detail -> header` untuk mencari MAWB split.

**Alternatif Paling Rapi Secara Arsitektur**
Kalau mau lebih normalized dan scalable, buat tabel baru:

```text
build_up_check_master
```

Isi:

- `id`
- `mawb`
- `flight_no`
- `flight_date`
- `master_total_pieces`
- `is_split_uld`
- `split_total_uld`

Lalu `build_up_check_detail` menjadi allocation per ULD:

```text
build_up_check_detail.master_id -> build_up_check_master.id
build_up_check_detail.header_id -> build_up_check_header.id
build_up_check_detail.total_pieces = pieces untuk ULD ini
```

Ini paling bersih secara database normalization, tapi perubahan lebih besar karena API dan mobile perlu ikut menyesuaikan. Untuk kondisi project sekarang, saya sarankan **pakai pendekatan minimal dulu**: tambah metadata split di `build_up_check_detail`, lalu backend yang maintain.

**Dampak ke Mobile**
Mobile tidak perlu menentukan split sendiri. Mobile cukup:

- input MAWB dan pieces untuk ULD aktif;
- menampilkan badge seperti `SPLIT ULD` jika response detail punya `is_split_uld = true`;
- opsional tampilkan `2 ULD` dari `split_total_uld`.

Jadi source of truth tetap backend, sesuai aturan agent project.

---

# koreksi alur buildup

Betul, mas ganteng. Penyelesaiannya: alur harus diubah dari **input total pieces ULD di awal** menjadi **input actual pieces dulu, lalu finalisasi ULD saat penuh**.

**Masalah Alur Sekarang**
Saat ini `build_up_check_detail.total_pieces` dipakai sebagai batas pieces untuk ULD itu. Akibatnya mobile memaksa operator tahu dulu:

> MAWB ini masuk berapa pieces ke ULD ini?

Padahal kondisi real:

1. Operator tahu total MAWB, misalnya 100 pieces.
2. Barang masuk ke ULD berjalan bertahap.
3. ULD ternyata penuh di 63 pieces.
4. Sisa 37 pieces harus masuk ULD lain.

Jadi `total_pieces` per ULD tidak boleh wajib di awal.

**Best Practice Baru**
Gunakan konsep:

- `master_total_pieces` = total pieces MAWB asli, contoh 100.
- `total_pieces` = final allocation untuk ULD ini, boleh kosong saat proses.
- `completed_pieces` = hasil sum dari `build_up_check_rincian`.
- Saat ULD penuh, operator tekan tombol **Finalisasi / Split ULD**.
- Backend set `total_pieces = completed_pieces` untuk ULD itu.
- Backend hitung sisa MAWB dari total semua rincian MAWB lintas ULD.
- Jika sisa > 0, MAWB dianggap split dan bisa dilanjutkan di ULD berikutnya.

**Skema Tambahan yang Saya Sarankan**
Tambahkan kolom kecil di `build_up_check_detail`:

```sql
is_allocation_final TINYINT(1) NOT NULL DEFAULT 0
```

Opsional tapi bagus:

```sql
allocation_closed_at TIMESTAMP NULL
```

Maknanya:

- `is_allocation_final = 0`: MAWB di ULD ini masih bisa ditambah pieces.
- `is_allocation_final = 1`: ULD ini sudah ditutup/final untuk MAWB tersebut.

**Perubahan Validasi**
Current:

```text
rincian pieces tidak boleh melebihi total_pieces
```

Ubah menjadi:

```text
Jika total_pieces ULD belum final/null:
  rincian boleh bertambah selama total seluruh MAWB lintas ULD tidak melebihi master_total_pieces.

Jika total_pieces ULD sudah final:
  detail tidak boleh ditambah lagi.
```

**Flow Mobile yang Lebih Pas**

1. Pilih ULD.
2. Tambah MAWB.
3. Isi:
   - MAWB
   - Total Pieces MAWB
   - Agent
   - Remark
4. Masuk screen rincian.
5. Input pieces aktual berkali-kali.
6. Kalau ULD penuh, tekan **Tutup Alokasi ULD**.
7. Jika masih ada sisa MAWB, mobile tampilkan:
   - `Sisa 37 pieces`
   - `Lanjutkan di ULD lain`

**Kesimpulan**
Jadi fix yang benar bukan sekadar tambah kolom split, tapi menambah status **allocation final**. `split` harus menjadi hasil dari actual pieces lintas ULD, bukan keputusan manual di awal.

Saya sarankan next task saya eksekusi perubahan ini:

- backend: migration `is_allocation_final`, endpoint finalisasi ULD allocation, validasi total lintas ULD;
- mobile: `Pieces ULD Ini` tidak wajib saat tambah MAWB, tambah tombol **Tutup Alokasi ULD** di screen rincian.
