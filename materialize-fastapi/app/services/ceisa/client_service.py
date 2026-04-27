"""Client reusable untuk komunikasi API CEISA."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from fastapi import HTTPException

from app.utils.env import ENV


class CeisaClientService:
    """Client HTTP CEISA berbasis OAuth2 + API key."""

    def __init__(self):
        """Inisialisasi konfigurasi dasar client CEISA."""
        self.base_url = str(ENV.CEISA_BASE_URL or "").rstrip("/")
        self.auth_url = str(ENV.CEISA_AUTH_URL or "").strip()
        self.client_id = str(ENV.CEISA_CLIENT_ID or "").strip()
        self.client_secret = str(ENV.CEISA_CLIENT_SECRET or "").strip()
        self.api_key = str(ENV.CEISA_API_KEY or "").strip()
        self.timeout = max(1, int(ENV.CEISA_TIMEOUT))
        self._access_token: str | None = None
        self._token_expired_at: datetime | None = None

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

        if response.status_code in {401, 403}:
            self._access_token = None
            self._token_expired_at = None
            raise HTTPException(status_code=502, detail="Autentikasi CEISA API tidak valid")

        if response.status_code >= 400:
            detail = response.text.strip()[:500] or "Request CEISA API gagal"
            raise HTTPException(status_code=502, detail=f"CEISA API error: {detail}")

        try:
            return response.json()
        except ValueError:
            return response.text

    def _build_headers(self) -> dict[str, str]:
        """Bangun header standar untuk request CEISA."""
        headers: dict[str, str] = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self._get_access_token()}",
        }
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    def _get_access_token(self) -> str:
        """Ambil token OAuth2, gunakan cache jika masih valid."""
        if (
            self._access_token
            and self._token_expired_at
            and datetime.now(timezone.utc) < self._token_expired_at
        ):
            return self._access_token

        token_payload = self._fetch_access_token()
        access_token = str(token_payload.get("access_token") or "").strip()
        if not access_token:
            raise HTTPException(status_code=500, detail="CEISA access token tidak ditemukan")

        expires_in_raw = token_payload.get("expires_in", 300)
        try:
            expires_in = int(expires_in_raw)
        except (TypeError, ValueError):
            expires_in = 300
        expires_in = max(60, expires_in)

        self._access_token = access_token
        self._token_expired_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in - 30)
        return self._access_token

    def _fetch_access_token(self) -> dict[str, Any]:
        """Minta token baru ke endpoint OAuth2 CEISA."""
        try:
            response = requests.post(
                self.auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise HTTPException(
                status_code=502, detail=f"Gagal request token CEISA: {exc!s}"
            ) from exc

        if response.status_code >= 400:
            detail = response.text.strip()[:500] or "Request token CEISA gagal"
            raise HTTPException(status_code=500, detail=f"Token CEISA gagal: {detail}")

        try:
            payload = response.json()
        except ValueError as exc:
            raise HTTPException(status_code=500, detail="Format token CEISA tidak valid") from exc

        if not isinstance(payload, dict):
            raise HTTPException(status_code=500, detail="Response token CEISA tidak valid")
        return payload

    def _ensure_configuration(self) -> None:
        """Validasi konfigurasi minimum client CEISA."""
        missing = [
            key
            for key, value in {
                "CEISA_BASE_URL": self.base_url,
                "CEISA_AUTH_URL": self.auth_url,
                "CEISA_CLIENT_ID": self.client_id,
                "CEISA_CLIENT_SECRET": self.client_secret,
            }.items()
            if not value
        ]
        if missing:
            joined = ", ".join(missing)
            raise HTTPException(
                status_code=500, detail=f"Konfigurasi CEISA belum lengkap: {joined}"
            )
