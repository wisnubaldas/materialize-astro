"""Service reusable untuk endpoint Reference Code CEISA."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app.services.ceisa.client_service import CeisaClientService


class CeisaReferenceCodeService:
    """Service untuk mengakses dan menormalkan response Reference Code CEISA."""

    def __init__(self, client: CeisaClientService):
        """Inisialisasi service dengan client CEISA."""
        self.client = client

    def get_reference_origin_goods(self) -> list[dict[str, str]]:
        """Ambil data `Referensi Asal Barang` dari CEISA."""
        payload = self._get_first_success_payload(
            candidate_paths=[
                "/openapi/referensi/asal-barang",
                "/openapi/referensi/referensi-asal-barang",
                "/openapi/reference-code/referensi-asal-barang",
            ]
        )
        items = self.extract_reference_rows(
            payload=payload,
            code_keys=["kodeAsalBarang", "KODE_ASAL_BARANG", "kode", "code", "id"],
            name_keys=["namaAsalBarang", "NAMA_ASAL_BARANG", "nama", "name", "uraian"],
        )
        if not items:
            raise HTTPException(
                status_code=502,
                detail="Response CEISA Referensi Asal Barang tidak memiliki data valid",
            )
        return items

    def _get_first_success_payload(self, candidate_paths: list[str]) -> Any:
        """Coba beberapa endpoint sampai salah satu berhasil."""
        last_error: HTTPException | None = None
        for path in candidate_paths:
            try:
                return self.client.get(path)
            except HTTPException as exc:
                last_error = exc
                continue
        if last_error is not None:
            raise last_error
        raise HTTPException(status_code=502, detail="Endpoint CEISA tidak tersedia")

    @staticmethod
    def extract_reference_rows(
        payload: Any,
        code_keys: list[str],
        name_keys: list[str],
    ) -> list[dict[str, str]]:
        """Normalisasi bentuk payload reference menjadi list `{code, name}`."""
        candidates = CeisaReferenceCodeService._extract_candidate_rows(payload)
        normalized: list[dict[str, str]] = []
        for row in candidates:
            if not isinstance(row, dict):
                continue
            code = CeisaReferenceCodeService._pick_first_value(row, code_keys)
            name = CeisaReferenceCodeService._pick_first_value(row, name_keys)
            if not code or not name:
                continue
            normalized.append(
                {
                    "code": code,
                    "name": name,
                    "description": name,
                }
            )
        return normalized

    @staticmethod
    def _extract_candidate_rows(payload: Any) -> list[dict[str, Any]]:
        """Ekstrak list kandidat row dari berbagai bentuk payload CEISA."""
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]

        if not isinstance(payload, dict):
            return []

        for key in ("data", "result", "results", "items", "rows", "body"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
            if isinstance(value, dict):
                nested = CeisaReferenceCodeService._extract_candidate_rows(value)
                if nested:
                    return nested

        return []

    @staticmethod
    def _pick_first_value(row: dict[str, Any], keys: list[str]) -> str | None:
        """Ambil nilai string pertama yang valid dari beberapa kandidat key."""
        for key in keys:
            value = row.get(key)
            if value is None:
                continue
            text = str(value).strip()
            if text:
                return text
        return None
