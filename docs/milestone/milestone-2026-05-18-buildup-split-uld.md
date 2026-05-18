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
