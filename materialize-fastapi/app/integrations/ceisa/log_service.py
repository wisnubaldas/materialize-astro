"""Service reusable untuk logging request/response dan webhook CEISA."""

from __future__ import annotations

from typing import Any

from app.repository.ceisa_log_repository import CeisaLogRepository


class CeisaLogService:
    """Facade logging CEISA agar reusable lintas modul CEISA."""

    def __init__(self, repository: CeisaLogRepository):
        """Inisialisasi service dengan repository log CEISA."""
        self.repository = repository

    def log_outbound_request(  # noqa: PLR0913
        self,
        service_name: str,
        endpoint_path: str,
        http_method: str,
        request_headers: dict[str, Any] | None,
        request_payload: Any,
        request_id: str | None = None,
    ):
        """Simpan log awal request outbound CEISA secara non-blocking."""
        try:
            return self.repository.create_request_log(
                service_name=service_name,
                endpoint_path=endpoint_path,
                http_method=http_method,
                request_headers=self._sanitize_headers(request_headers),
                request_payload=request_payload,
                request_id=request_id,
            )
        except Exception:
            return None

    def log_outbound_success(
        self,
        request_log,
        response_status_code: int,
        response_headers: dict[str, Any] | None,
        response_payload: Any,
    ) -> None:
        """Update log outbound CEISA sukses secara non-blocking."""
        if not request_log:
            return
        try:  # noqa: SIM105
            self.repository.mark_request_success(
                log=request_log,
                response_status_code=response_status_code,
                response_headers=self._sanitize_headers(response_headers),
                response_payload=response_payload,
            )
        except Exception:
            pass

    def log_outbound_failed(
        self,
        request_log,
        error_message: str,
        response_status_code: int | None = None,
        response_headers: dict[str, Any] | None = None,
        response_payload: Any = None,
    ) -> None:
        """Update log outbound CEISA gagal secara non-blocking."""
        if not request_log:
            return
        try:  # noqa: SIM105
            self.repository.mark_request_failed(
                log=request_log,
                error_message=error_message,
                response_status_code=response_status_code,
                response_headers=self._sanitize_headers(response_headers),
                response_payload=response_payload,
            )
        except Exception:
            pass

    def log_webhook_received(  # noqa: PLR0913
        self,
        webhook_event_id: str | None,
        event_type: str | None,
        request_headers: dict[str, Any] | None,
        request_payload: Any,
        signature_value: str | None = None,
        signature_valid: bool | None = None,
    ):
        """Simpan log awal webhook inbound CEISA secara non-blocking."""
        try:
            return self.repository.create_webhook_log(
                webhook_event_id=webhook_event_id,
                event_type=event_type,
                request_headers=self._sanitize_headers(request_headers),
                request_payload=request_payload,
                signature_value=signature_value,
                signature_valid=signature_valid,
            )
        except Exception:
            return None

    @staticmethod
    def _sanitize_headers(headers: dict[str, Any] | None) -> dict[str, Any] | None:
        """Masking header sensitif sebelum disimpan ke log."""
        if headers is None:
            return None
        masked: dict[str, Any] = {}
        for key, value in headers.items():
            lowered = key.lower()
            if lowered in {"authorization", "beacukai-api-key", "nle-api-key", "x-api-key"}:
                masked[key] = "***"
            else:
                masked[key] = value
        return masked
