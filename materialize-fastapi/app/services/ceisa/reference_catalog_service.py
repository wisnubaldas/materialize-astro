"""Service parser referensi CEISA dari dokumentasi GitBook."""

from __future__ import annotations

import re
from html import unescape

import requests
from fastapi import HTTPException

from app.utils.env import ENV

CEISA_REFERENCE_CATALOG: list[dict[str, str]] = [{'reference_slug': 'referensi-asal-barang', 'reference_name': 'Referensi Asal Barang'},
 {'reference_slug': 'referensi-asal-barang-ftz', 'reference_name': 'Referensi Asal Barang FTZ'},
 {'reference_slug': 'referensi-bank', 'reference_name': 'Referensi Bank'},
 {'reference_slug': 'referensi-cara-angkut', 'reference_name': 'Referensi Cara Angkut'},
 {'reference_slug': 'referensi-cara-bayar', 'reference_name': 'Referensi Cara Bayar'},
 {'reference_slug': 'referensi-cara-dagang', 'reference_name': 'Referensi Cara Dagang'},
 {'reference_slug': 'referensi-daerah-asal', 'reference_name': 'Referensi Daerah Asal'},
 {'reference_slug': 'referensi-dokumen', 'reference_name': 'Referensi Dokumen'},
 {'reference_slug': 'referensi-entitas', 'reference_name': 'Referensi Entitas'},
 {'reference_slug': 'referensi-fasilitas', 'reference_name': 'Referensi Fasilitas'},
 {'reference_slug': 'referensi-fasilitas-tarif', 'reference_name': 'Referensi Fasilitas Tarif'},
 {'reference_slug': 'referensi-ijin', 'reference_name': 'Referensi Ijin'},
 {'reference_slug': 'referensi-incoterm', 'reference_name': 'Referensi Incoterm'},
 {'reference_slug': 'referensi-jenis-api', 'reference_name': 'Referensi Jenis API'},
 {'reference_slug': 'referensi-jenis-ekspor', 'reference_name': 'Referensi Jenis Ekspor'},
 {'reference_slug': 'referensi-jenis-identitas', 'reference_name': 'Referensi Jenis Identitas'},
 {'reference_slug': 'referensi-jenis-impor', 'reference_name': 'Referensi Kode Jenis Impor'},
 {'reference_slug': 'referensi-jenis-jaminan', 'reference_name': 'Referensi Jenis Jaminan'},
 {'reference_slug': 'referensi-jenis-kemasan', 'reference_name': 'Referensi Jenis Kemasan'},
 {'reference_slug': 'referensi-jenis-kontainer', 'reference_name': 'Referensi Jenis Kontainer'},
 {'reference_slug': 'referensi-jenis-nilai', 'reference_name': 'Referensi Jenis VD'},
 {'reference_slug': 'referensi-jenis-pengangkutan',
  'reference_name': 'Referensi Jenis Pengangkutan'},
 {'reference_slug': 'referensi-jenis-prosedur', 'reference_name': 'Referensi Jenis PIB / Prosedur'},
 {'reference_slug': 'referensi-jenis-pungutan', 'reference_name': 'Referensi Jenis Pungutan'},
 {'reference_slug': 'referensi-jenis-tanda-pengaman',
  'reference_name': 'Referensi Jenis Tanda Pengaman'},
 {'reference_slug': 'referensi-jenis-tarif', 'reference_name': 'Referensi Jenis Tarif'},
 {'reference_slug': 'referensi-jenis-tpb', 'reference_name': 'Referensi Jenis TPB'},
 {'reference_slug': 'referensi-jenis-transaksi-perdagangan',
  'reference_name': 'Referensi Jenis Transaksi Perdagangan'},
 {'reference_slug': 'referensi-kantor', 'reference_name': 'Referensi Kantor'},
 {'reference_slug': 'referensi-kategori-barang', 'reference_name': 'Referensi Kategori Barang'},
 {'reference_slug': 'referensi-kategori-ekspor', 'reference_name': 'Referensi Kategori Ekspor'},
 {'reference_slug': 'referensi-kategori-keluar-ftz',
  'reference_name': 'Referensi Kategori Keluar FTZ'},
 {'reference_slug': 'referensi-kategori-konsolidator',
  'reference_name': 'Referensi Kategori Konsolidator'},
 {'reference_slug': 'referensi-kategori-masuk-ftz',
  'reference_name': 'Referensi Kategori Masuk FTZ'},
 {'reference_slug': 'referensi-komoditi-cukai', 'reference_name': 'Referensi Komoditi Cukai'},
 {'reference_slug': 'referensi-kondisi-barang', 'reference_name': 'Referensi Kondisi Barang'},
 {'reference_slug': 'referensi-lokasi-bayar', 'reference_name': 'Referensi Lokasi Bayar'},
 {'reference_slug': 'referensi-negara', 'reference_name': 'Referensi Negara'},
 {'reference_slug': 'referensi-respon', 'reference_name': 'Referensi Respon'},
 {'reference_slug': 'referensi-satuan-barang', 'reference_name': 'Referensi Satuan Barang'},
 {'reference_slug': 'referensi-spesifikasi-khusus',
  'reference_name': 'Referensi Spesifikasi Khusus'},
 {'reference_slug': 'referensi-spesifikasi-khusus-detail',
  'reference_name': 'Referensi Spesifikasi Khusus Detail'},
 {'reference_slug': 'referensi-status', 'reference_name': 'Referensi Status'},
 {'reference_slug': 'referensi-status-pengusaha', 'reference_name': 'Referensi Status Pengusaha'},
 {'reference_slug': 'referensi-tipe-kontainer', 'reference_name': 'Referensi Tipe Kontainer'},
 {'reference_slug': 'referensi-tujuan-pemasukan', 'reference_name': 'Referensi Tujuan Pemasukan'},
 {'reference_slug': 'referensi-tujuan-pengeluaran',
  'reference_name': 'Referensi Tujuan Pengeluaran'},
 {'reference_slug': 'referensi-tujuan-pengiriman', 'reference_name': 'Referensi Tujuan Pengiriman'},
 {'reference_slug': 'referensi-tutup-pu', 'reference_name': 'Referensi Tutup Pu'},
 {'reference_slug': 'referensi-ukuran-kontainer', 'reference_name': 'Referensi Ukuran Kontainer'},
 {'reference_slug': 'referensi-valuta', 'reference_name': 'Referensi Valuta'}]


class CeisaReferenceCatalogService:
    """Service untuk mengambil referensi CEISA dari GitBook markdown."""

    def __init__(self):
        """Inisialisasi service parser dokumentasi."""
        self.timeout = max(1, int(ENV.CEISA_TIMEOUT))
        self._catalog_by_slug = {
            item["reference_slug"]: dict(item) for item in CEISA_REFERENCE_CATALOG
        }

    def list_catalog(self) -> list[dict[str, str]]:
        """Daftar kategori referensi CEISA yang didukung."""
        return [dict(item) for item in CEISA_REFERENCE_CATALOG]

    def get_catalog_item(self, reference_slug: str) -> dict[str, str]:
        """Ambil metadata kategori berdasarkan slug."""
        item = self._catalog_by_slug.get(reference_slug)
        if item is None:
            raise HTTPException(status_code=404, detail="Kategori referensi CEISA tidak didukung")
        return dict(item)

    def fetch_reference_rows(self, reference_slug: str) -> list[dict[str, str]]:
        """Ambil snapshot data referensi dari dokumentasi GitBook."""
        item = self.get_catalog_item(reference_slug)
        markdown = self._fetch_markdown(self._build_doc_url(reference_slug))
        parsed_pairs = self._parse_rows(markdown)
        if not parsed_pairs:
            raise HTTPException(
                status_code=502,
                detail=f"Data tabel kosong untuk {item['reference_name']}",
            )

        rows: list[dict[str, str]] = []
        for code, name in parsed_pairs:
            rows.append(
                {
                    "reference_slug": item["reference_slug"],
                    "reference_name": item["reference_name"],
                    "code": code,
                    "name": name,
                    "description": name,
                }
            )
        return rows

    def _build_doc_url(self, reference_slug: str) -> str:
        """Bangun URL markdown GitBook dari slug referensi."""
        return f"https://ceisa40.gitbook.io/pia-ceisa40/referensi/{reference_slug}.md"

    def _fetch_markdown(self, doc_url: str) -> str:
        """Request markdown referensi dari GitBook."""
        try:
            response = requests.get(doc_url, timeout=self.timeout)
        except requests.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Gagal mengakses dokumentasi CEISA: {exc!s}",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"Gagal mengambil dokumentasi CEISA (HTTP {response.status_code})",
            )
        return response.text

    def _parse_rows(self, markdown: str) -> list[tuple[str, str]]:
        """Parse tabel referensi dari markdown/html campuran GitBook."""
        rows = (
            self._parse_html_table(markdown)
            if "<table" in markdown
            else self._parse_markdown_table(markdown)
        )

        deduped: list[tuple[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for code, name in rows:
            key = (code, name)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(key)
        return deduped

    def _parse_markdown_table(self, markdown: str) -> list[tuple[str, str]]:
        """Parse tabel markdown `| col | col |` menjadi pasangan code-name."""
        lines = [line for line in markdown.splitlines() if line.strip().startswith("|")]
        if len(lines) < 3:
            return []

        rows: list[tuple[str, str]] = []
        for line in lines[2:]:
            columns = [part.strip() for part in line.strip().split("|")[1:-1]]
            if len(columns) < 2:
                continue
            code = self._clean_text(columns[0])
            name = self._clean_text(columns[1])
            if not code or not name or set(code) == {"-"}:
                continue
            rows.append((code, name))
        return rows

    def _parse_html_table(self, markdown: str) -> list[tuple[str, str]]:
        """Parse tabel HTML menjadi pasangan code-name."""
        table_pattern = re.compile(r"<table[^>]*>(.*?)</table>", flags=re.IGNORECASE | re.DOTALL)
        row_pattern = re.compile(r"<tr[^>]*>(.*?)</tr>", flags=re.IGNORECASE | re.DOTALL)
        th_pattern = re.compile(r"<th[^>]*>(.*?)</th>", flags=re.IGNORECASE | re.DOTALL)
        td_pattern = re.compile(r"<td[^>]*>(.*?)</td>", flags=re.IGNORECASE | re.DOTALL)

        rows: list[tuple[str, str]] = []

        for table_html in table_pattern.findall(markdown):
            headers: list[str] = []
            data_rows: list[list[str]] = []

            for row_html in row_pattern.findall(table_html):
                th_cells = [self._clean_text(cell) for cell in th_pattern.findall(row_html)]
                td_cells = [self._clean_text(cell) for cell in td_pattern.findall(row_html)]

                if th_cells and not headers:
                    headers = th_cells
                    continue
                if td_cells:
                    data_rows.append(td_cells)

            if not data_rows:
                continue
            if not headers:
                headers = [f"col_{idx}" for idx in range(len(data_rows[0]))]

            code_idx, name_idx = self._pick_columns(headers)

            for values in data_rows:
                if code_idx >= len(values) or name_idx >= len(values):
                    continue
                code = values[code_idx]
                name = values[name_idx]
                if not code or not name or self._is_header_like(code, name):
                    continue
                if set(code) == {"-"}:
                    continue
                rows.append((code, name))

        return rows

    def _pick_columns(self, headers: list[str]) -> tuple[int, int]:
        """Pilih indeks kolom code dan name secara heuristik."""
        normalized = [header.lower() for header in headers]
        name_keywords = ("uraian", "nama", "keterangan", "description", "deskripsi")
        name_idx = next(
            (idx for idx, col in enumerate(normalized) if any(word in col for word in name_keywords)),
            1 if len(headers) > 1 else 0,
        )

        code_candidates = [idx for idx, col in enumerate(normalized) if "kode" in col or "code" in col]
        filtered_candidates = [
            idx for idx in code_candidates if "dokumen" not in normalized[idx] and idx != name_idx
        ]

        if filtered_candidates:
            code_idx = filtered_candidates[0]
        elif code_candidates:
            code_idx = next((idx for idx in code_candidates if idx != name_idx), code_candidates[0])
        else:
            code_idx = 0

        if code_idx == name_idx and len(headers) > 1:
            code_idx = 0
            name_idx = 1
        return code_idx, name_idx

    def _is_header_like(self, code: str, name: str) -> bool:
        """Deteksi baris header yang ikut terbaca sebagai data."""
        code_l = code.lower()
        name_l = name.lower()
        if "kode" in code_l and ("nama" in name_l or "uraian" in name_l or "kode" in name_l):
            return True
        return code_l in {"kode", "kode respon", "code"}

    @staticmethod
    def _clean_text(value: str) -> str:
        """Normalisasi teks tabel dari markdown/html."""
        text = unescape(value)
        text = re.sub(r"<[^>]+>", " ", text)
        text = text.replace("**", "").replace("__", "")
        text = text.replace("\\_", "_").replace("\\|", "|")
        text = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()
