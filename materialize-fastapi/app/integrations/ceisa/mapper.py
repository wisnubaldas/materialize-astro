"""Mapper agnostic untuk normalisasi payload API CEISA."""

from __future__ import annotations

from typing import Any

from app.integrations.ceisa.schemas import CeisaReferenceRow


class CeisaPayloadMapper:
    """Utility mapper stateless untuk membentuk data standar CEISA."""

    @staticmethod
    def extract_reference_rows(
        payload: Any,
        code_keys: list[str],
        name_keys: list[str],
    ) -> list[CeisaReferenceRow]:
        """Normalisasi payload reference menjadi list row standar."""
        candidates = CeisaPayloadMapper.extract_candidate_rows(payload)
        normalized: list[CeisaReferenceRow] = []
        for row in candidates:
            if not isinstance(row, dict):
                continue
            code = CeisaPayloadMapper.pick_first_value(row, code_keys)
            name = CeisaPayloadMapper.pick_first_value(row, name_keys)
            if not code or not name:
                continue
            normalized.append(CeisaReferenceRow(code=code, name=name, description=name))
        return normalized

    @staticmethod
    def extract_candidate_rows(payload: Any) -> list[dict[str, Any]]:
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
                nested = CeisaPayloadMapper.extract_candidate_rows(value)
                if nested:
                    return nested
        return []

    @staticmethod
    def pick_first_value(row: dict[str, Any], keys: list[str]) -> str | None:
        """Ambil nilai string pertama yang valid dari beberapa kandidat key."""
        for key in keys:
            value = row.get(key)
            if value is None:
                continue
            text = str(value).strip()
            if text:
                return text
        return None

