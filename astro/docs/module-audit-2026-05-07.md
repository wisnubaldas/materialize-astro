# Module Audit 2026-05-07

## Scope

Audit dan standardisasi import path pada seluruh modul frontend Astro.

## Modul yang Diaudit

- admin
- angkasapura
- auth
- edi
- hub-net
- setting
- warehouse
- tps

## Hasil

- `admin`: selesai, atribut `AdminLayout` dirapikan.
- `angkasapura`: selesai, import page distandarisasi ke barrel `@components/angkasapura`.
- `auth`: selesai, import page distandarisasi ke barrel `@components/auth`.
- `edi`: selesai, import page distandarisasi ke barrel `@components/edi`; frontmatter `send-email/[slug].astro` dirapikan ke JavaScript murni.
- `hub-net`: selesai, import page distandarisasi ke barrel `@components/hubnet`; nama komponen upload dipisahkan jelas.
- `setting`: selesai, import page distandarisasi ke barrel `@components/setting`.
- `warehouse`: selesai, import page distandarisasi ke barrel `@components/warehouse`.
- `tps`: belum ada page/komponen aktif untuk dirapikan (folder route ada, konten belum tersedia).

## Verifikasi

- `npm run build` pada `astro/` berhasil.
- Tidak ditemukan lagi pola `title="..." ,` pada halaman Astro yang diaudit.
- Tidak ada sisa `Record<...>` TypeScript annotation pada page Astro.

## Residual Gap

- Struktur asset fisik (`src/libs`, `src/vendor`, `public/assets`) masih legacy; belum direlokasi massal demi menghindari regression.
- Beberapa nama file komponen legacy masih campuran (`kebab-case` dan `PascalCase`), tetapi import entry point modul sudah konsisten.
