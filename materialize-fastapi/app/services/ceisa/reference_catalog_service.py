"""Service parser referensi CEISA dari dokumentasi GitBook."""

from __future__ import annotations

import re
from html import unescape

import requests
from fastapi import HTTPException

from app.utils.env import ENV

CEISA_REFERENCE_CATALOG: list[dict[str, str]] = [
    {
        "reference_slug": "referensi-asal-barang",
        "reference_name": "Referensi Asal Barang",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-asal-barang.md",
    },
    {
        "reference_slug": "referensi-asal-barang-ftz",
        "reference_name": "Referensi Asal Barang FTZ",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-asal-barang-ftz.md",
    },
    {
        "reference_slug": "referensi-bank",
        "reference_name": "Referensi Bank",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-bank.md",
    },
    {
        "reference_slug": "referensi-cara-angkut",
        "reference_name": "Referensi Cara Angkut",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-cara-angkut.md",
    },
    {
        "reference_slug": "referensi-cara-bayar",
        "reference_name": "Referensi Cara Bayar",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-cara-bayar.md",
    },
    {
        "reference_slug": "referensi-cara-dagang",
        "reference_name": "Referensi Cara Dagang",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-cara-dagang.md",
    },
    {
        "reference_slug": "referensi-daerah-asal",
        "reference_name": "Referensi Daerah Asal",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-daerah-asal.md",
    },
    {
        "reference_slug": "referensi-dokumen",
        "reference_name": "Referensi Dokumen",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-dokumen.md",
    },
    {
        "reference_slug": "referensi-entitas",
        "reference_name": "Referensi Entitas",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-entitas.md",
    },
    {
        "reference_slug": "referensi-fasilitas",
        "reference_name": "Referensi Fasilitas",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-fasilitas.md",
    },
    {
        "reference_slug": "referensi-fasilitas-tarif",
        "reference_name": "Referensi Fasilitas Tarif",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-fasilitas-tarif.md",
    },
    {
        "reference_slug": "referensi-ijin",
        "reference_name": "Referensi Ijin",
        "doc_url": "https://ceisa40.gitbook.io/pia-ceisa40/referensi/referensi-ijin.md",
    },
]


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
        markdown = self._fetch_markdown(item["doc_url"])
        parsed_pairs = self._parse_rows(markdown)
        if not parsed_pairs:
            raise HTTPException(
                status_code=502, detail=f"Data tabel kosong untuk {item['reference_name']}"
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
                    "doc_url": item["doc_url"],
                    "source": "CEISA_GITBOOK",
                }
            )
        return rows

    def _fetch_markdown(self, doc_url: str) -> str:
        """Request markdown referensi dari GitBook."""
        try:
            response = requests.get(doc_url, timeout=self.timeout)
        except requests.RequestException as exc:
            raise HTTPException(
                status_code=502, detail=f"Gagal mengakses dokumentasi CEISA: {exc!s}"
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
            if "<table>" in markdown
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
        """Parse tabel HTML `<table>` pada markdown GitBook."""
        pattern = re.compile(
            r"<tr><td>(.*?)</td><td>(.*?)</td></tr>", flags=re.IGNORECASE | re.DOTALL
        )
        rows: list[tuple[str, str]] = []
        for code_raw, name_raw in pattern.findall(markdown):
            code = self._clean_text(code_raw)
            name = self._clean_text(name_raw)
            if code and name:
                rows.append((code, name))
        return rows

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
