"""Schema agnostic untuk pertukaran data CEISA lintas layer."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CeisaRequestContext:
    """Payload request outbound CEISA yang siap diaudit."""

    service_name: str
    endpoint_path: str
    http_method: str
    request_headers: dict[str, Any] | None
    request_payload: Any
    request_id: str | None = None


@dataclass(frozen=True)
class CeisaReferenceRow:
    """Representasi row referensi CEISA yang telah dinormalisasi."""

    code: str
    name: str
    description: str | None = None

    def to_dict(self) -> dict[str, str | None]:
        """Konversi ke dictionary agar kompatibel dengan repository lama."""
        return {
            "code": self.code,
            "name": self.name,
            "description": self.description or self.name,
        }

