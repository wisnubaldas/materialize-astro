"""Client reusable untuk komunikasi API CEISA."""

from __future__ import annotations

from typing import Any

import requests
from fastapi import HTTPException

from app.repository.ceisa_log_repository import CeisaLogRepository
from app.services.ceisa.oauth_service import CeisaOAuthService
from app.utils.env import ENV


class CeisaClientService:
    """Client HTTP CEISA berbasis OAuth2 + API key."""

    def __init__(
        self,
        oauth_service: CeisaOAuthService,
        log_repository: CeisaLogRepository | None = None,
    ):
        """Inisialisasi konfigurasi dasar client CEISA."""
        self.base_url = str(ENV.CEISA_BASE_URL or "").rstrip("/")
        self.api_key = str(ENV.CEISA_API_KEY or "").strip()
        self.platform_id = str(ENV.CEISA_PLATFORM_ID or "").strip()
        self.origin = str(ENV.CEISA_ORIGIN or ENV.APP_URL or "").strip()
        self.timeout = max(1, int(ENV.CEISA_TIMEOUT))
        self.oauth_service = oauth_service
        self.log_repository = log_repository

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        """Lakukan HTTP GET ke endpoint CEISA."""
        return self.request("GET", path=path, params=params)

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        """Lakukan request HTTP generik ke endpoint CEISA."""
        self._ensure_configuration()

        normalized_path = path if path.startswith("/") else f"/{path}"
        url = f"{self.base_url}{normalized_path}"

        headers = dict(kwargs.pop("headers", {}) or {})
        headers.update(self._build_headers())
        request_log = self._create_request_log(
            endpoint_path=normalized_path,
            http_method=method,
            headers=headers,
            payload={"params": kwargs.get("params"), "json": kwargs.get("json"), "data": kwargs.get("data")},
        )

        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=headers,
                timeout=self.timeout,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise HTTPException(
                status_code=502, detail=f"Gagal menghubungi CEISA API: {exc!s}"
            ) from exc

        response_payload: Any
        try:
            response_payload = response.json()
        except ValueError:
            response_payload = response.text

        if response.status_code in {401, 403}:
            self.oauth_service.invalidate_token()
            self._safe_mark_failed(
                request_log=request_log,
                error_message="Autentikasi CEISA API tidak valid",
                response_status_code=response.status_code,
                response_headers=dict(response.headers),
                response_payload=response_payload,
            )
            raise HTTPException(status_code=502, detail="Autentikasi CEISA API tidak valid")

        if response.status_code >= 400:
            self._safe_mark_failed(
                request_log=request_log,
                error_message=f"CEISA API error HTTP {response.status_code}",
                response_status_code=response.status_code,
                response_headers=dict(response.headers),
                response_payload=response_payload,
            )
            detail = response.text.strip()[:500] or "Request CEISA API gagal"
            raise HTTPException(status_code=502, detail=f"CEISA API error: {detail}")

        self._safe_mark_success(
            request_log=request_log,
            response_status_code=response.status_code,
            response_headers=dict(response.headers),
            response_payload=response_payload,
        )
        return response_payload

    def _build_headers(self) -> dict[str, str]:
        """Bangun header standar untuk request CEISA."""
        access_token = self.oauth_service.get_access_token()
        headers: dict[str, str] = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }
        if self.api_key:
            headers["Beacukai-Api-Key"] = self.api_key
            headers["nle-api-key"] = self.api_key
        if self.platform_id:
            headers["id_platform"] = self.platform_id
        if self.origin:
            headers["Origin"] = self.origin
        return headers

    def _ensure_configuration(self) -> None:
        """Validasi konfigurasi minimum client CEISA."""
        missing = [
            key
            for key, value in {
                "CEISA_BASE_URL": self.base_url,
            }.items()
            if not value
        ]
        if missing:
            joined = ", ".join(missing)
            raise HTTPException(
                status_code=500, detail=f"Konfigurasi CEISA belum lengkap: {joined}"
            )

    def _create_request_log(
        self,
        endpoint_path: str,
        http_method: str,
        headers: dict[str, Any],
        payload: Any,
    ):
        """Buat audit log request outbound CEISA secara non-blocking."""
        if not self.log_repository:
            return None
        try:
            return self.log_repository.create_request_log(
                service_name="ceisa_api",
                endpoint_path=endpoint_path,
                http_method=http_method,
                request_headers=self._sanitize_headers(headers),
                request_payload=payload,
            )
        except Exception:
            return None

    def _safe_mark_success(
        self,
        request_log,
        response_status_code: int,
        response_headers: dict[str, Any],
        response_payload: Any,
    ) -> None:
        """Update audit log sukses secara non-blocking."""
        if not request_log or not self.log_repository:
            return
        try:
            self.log_repository.mark_request_success(
                log=request_log,
                response_status_code=response_status_code,
                response_headers=self._sanitize_headers(response_headers),
                response_payload=response_payload,
            )
        except Exception:
            pass

    def _safe_mark_failed(
        self,
        request_log,
        error_message: str,
        response_status_code: int | None = None,
        response_headers: dict[str, Any] | None = None,
        response_payload: Any = None,
    ) -> None:
        """Update audit log gagal secara non-blocking."""
        if not request_log or not self.log_repository:
            return
        try:
            self.log_repository.mark_request_failed(
                log=request_log,
                error_message=error_message,
                response_status_code=response_status_code,
                response_headers=self._sanitize_headers(response_headers or {}),
                response_payload=response_payload,
            )
        except Exception:
            pass

    @staticmethod
    def _sanitize_headers(headers: dict[str, Any] | None) -> dict[str, Any]:
        """Masking header sensitif sebelum disimpan ke log."""
        if headers is None:
            return {}
        masked: dict[str, Any] = {}
        for key, value in headers.items():
            lowered = key.lower()
            if lowered in {"authorization", "beacukai-api-key", "nle-api-key", "x-api-key"}:
                masked[key] = "***"
            else:
                masked[key] = value
        return masked
