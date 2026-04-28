"""Service OAuth 2.0 untuk autentikasi host-to-host CEISA."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from fastapi import HTTPException

from app.repository.ceisa_log_repository import CeisaLogRepository
from app.utils.env import ENV


class CeisaOAuthService:
    """Kelola token OAuth2 CEISA (login, refresh, cache, dan audit log)."""

    _access_token_cache: str | None = None
    _refresh_token_cache: str | None = None
    _token_expired_at_cache: datetime | None = None

    def __init__(self, log_repository: CeisaLogRepository | None = None):
        """Inisialisasi konfigurasi OAuth2 CEISA."""
        self.log_repository = log_repository
        self.timeout = max(1, int(ENV.CEISA_TIMEOUT))
        self.base_url = str(ENV.CEISA_BASE_URL or "").rstrip("/")
        self.auth_url = str(ENV.CEISA_AUTH_URL or "").strip()
        self.refresh_url = str(ENV.CEISA_REFRESH_URL or "").strip()
        self.username = str(ENV.CEISA_USERNAME or "").strip()
        self.password = str(ENV.CEISA_PASSWORD or "").strip()
        self.client_id = str(ENV.CEISA_CLIENT_ID or "").strip()
        self.client_secret = str(ENV.CEISA_CLIENT_SECRET or "").strip()

        if not self.auth_url and self.base_url:
            self.auth_url = f"{self.base_url}/nle-oauth/v1/user/login"
        if not self.refresh_url and self.base_url:
            self.refresh_url = f"{self.base_url}/nle-oauth/v1/user/update-token"

    def get_access_token(self, force_refresh: bool = False) -> str:
        """Ambil access token valid dari cache atau endpoint OAuth CEISA."""
        cache_cls = type(self)
        if (
            not force_refresh
            and cache_cls._access_token_cache
            and cache_cls._token_expired_at_cache
            and datetime.now(timezone.utc) < cache_cls._token_expired_at_cache
        ):
            return cache_cls._access_token_cache

        if cache_cls._refresh_token_cache:
            try:
                payload = self._request_refresh_token(cache_cls._refresh_token_cache)
                return self._cache_tokens(payload)
            except HTTPException:
                # fallback ke login ulang jika refresh token invalid/expired
                self.invalidate_token()

        payload = self._request_login_token()
        return self._cache_tokens(payload)

    def invalidate_token(self) -> None:
        """Bersihkan cache token in-memory."""
        cache_cls = type(self)
        cache_cls._access_token_cache = None
        cache_cls._refresh_token_cache = None
        cache_cls._token_expired_at_cache = None

    def _request_login_token(self) -> dict[str, Any]:
        """Request access token via endpoint login CEISA."""
        self._ensure_auth_configuration()
        endpoint_path = self._extract_endpoint_path(self.auth_url)
        headers = {"Content-Type": "application/json", "Accept": "application/json"}

        if self.username and self.password:
            request_payload: dict[str, Any] = {
                "username": self.username,
                "password": self.password,
            }
            return self._request_token(
                url=self.auth_url,
                endpoint_path=endpoint_path,
                request_payload=request_payload,
                headers=headers,
            )

        if self.client_id and self.client_secret:
            request_payload = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }
            headers = {"Accept": "application/json"}
            return self._request_token(
                url=self.auth_url,
                endpoint_path=endpoint_path,
                request_payload=request_payload,
                headers=headers,
                use_form_data=True,
            )

        raise HTTPException(
            status_code=500,
            detail=(
                "Konfigurasi OAuth CEISA belum lengkap: "
                "isi CEISA_USERNAME+CEISA_PASSWORD atau CEISA_CLIENT_ID+CEISA_CLIENT_SECRET"
            ),
        )

    def _request_refresh_token(self, refresh_token: str) -> dict[str, Any]:
        """Request access token baru via endpoint refresh token CEISA."""
        if not self.refresh_url:
            raise HTTPException(status_code=500, detail="CEISA refresh URL belum dikonfigurasi")
        endpoint_path = self._extract_endpoint_path(self.refresh_url)
        headers = {
            "Authorization": refresh_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        return self._request_token(
            url=self.refresh_url,
            endpoint_path=endpoint_path,
            request_payload=None,
            headers=headers,
        )

    def _request_token(
        self,
        url: str,
        endpoint_path: str,
        request_payload: dict[str, Any] | None,
        headers: dict[str, str],
        use_form_data: bool = False,
    ) -> dict[str, Any]:
        """Eksekusi HTTP request untuk endpoint OAuth CEISA dan audit log."""
        request_log = None
        if self.log_repository:
            try:
                request_log = self.log_repository.create_request_log(
                    service_name="ceisa_oauth",
                    endpoint_path=endpoint_path,
                    http_method="POST",
                    request_headers=self._sanitize_headers(headers),
                    request_payload=request_payload,
                )
            except Exception:
                request_log = None

        try:
            if use_form_data:
                response = requests.post(
                    url=url,
                    data=request_payload or {},
                    headers=headers,
                    timeout=self.timeout,
                )
            else:
                response = requests.post(
                    url=url,
                    json=request_payload,
                    headers=headers,
                    timeout=self.timeout,
                )
        except requests.RequestException as exc:
            self._safe_mark_failed(request_log, error_message=f"Gagal request OAuth CEISA: {exc!s}")
            raise HTTPException(
                status_code=502, detail=f"Gagal menghubungi OAuth CEISA: {exc!s}"
            ) from exc

        response_payload: Any
        try:
            response_payload = response.json()
        except ValueError:
            response_payload = response.text

        if response.status_code >= 400:
            self._safe_mark_failed(
                request_log,
                error_message=f"OAuth CEISA error HTTP {response.status_code}",
                response_status_code=response.status_code,
                response_headers=dict(response.headers),
                response_payload=response_payload,
            )
            detail = (
                response.text.strip()[:500]
                if isinstance(response_payload, str)
                else str(response_payload)[:500]
            )
            raise HTTPException(
                status_code=502,
                detail=f"OAuth CEISA gagal (HTTP {response.status_code}): {detail}",
            )

        self._safe_mark_success(
            request_log,
            response_status_code=response.status_code,
            response_headers=dict(response.headers),
            response_payload=response_payload,
        )

        if not isinstance(response_payload, dict):
            raise HTTPException(
                status_code=502,
                detail="Format response OAuth CEISA tidak valid (bukan object JSON)",
            )
        return response_payload

    def _cache_tokens(self, payload: dict[str, Any]) -> str:
        """Ekstrak token dari payload lalu simpan ke cache in-memory."""
        cache_cls = type(self)
        access_token = self._pick_first(payload, ("access_token", "accessToken", "token"))
        refresh_token = self._pick_first(
            payload,
            ("refresh_token", "refreshToken", "tokenRefresh", "refresh"),
        )
        expires_value = self._pick_first(
            payload,
            ("expires_in", "expiresIn", "expiredIn", "expireIn"),
        )

        if not access_token:
            nested_data = payload.get("data")
            if isinstance(nested_data, dict):
                access_token = self._pick_first(
                    nested_data, ("access_token", "accessToken", "token")
                )
                if not refresh_token:
                    refresh_token = self._pick_first(
                        nested_data,
                        ("refresh_token", "refreshToken", "tokenRefresh", "refresh"),
                    )
                if not expires_value:
                    expires_value = self._pick_first(
                        nested_data, ("expires_in", "expiresIn", "expiredIn", "expireIn")
                    )

        if not access_token:
            raise HTTPException(status_code=502, detail="Access token CEISA tidak ditemukan")

        expires_in = 300
        if expires_value:
            try:
                expires_in = int(expires_value)
            except (TypeError, ValueError):
                expires_in = 300
        expires_in = max(60, expires_in)

        cache_cls._access_token_cache = str(access_token).strip()
        cache_cls._refresh_token_cache = str(refresh_token).strip() if refresh_token else None
        cache_cls._token_expired_at_cache = datetime.now(timezone.utc) + timedelta(
            seconds=max(30, expires_in - 30)
        )
        return cache_cls._access_token_cache

    def _ensure_auth_configuration(self) -> None:
        """Validasi konfigurasi minimum autentikasi CEISA."""
        if not self.auth_url:
            raise HTTPException(status_code=500, detail="CEISA auth URL belum dikonfigurasi")

    @staticmethod
    def _pick_first(payload: dict[str, Any], keys: tuple[str, ...]) -> str | None:
        """Ambil nilai string pertama yang valid dari daftar kandidat key."""
        for key in keys:
            value = payload.get(key)
            if value is None:
                continue
            text = str(value).strip()
            if text:
                return text
        return None

    @staticmethod
    def _extract_endpoint_path(url: str) -> str:
        """Ekstrak endpoint path dari URL absolute untuk kebutuhan log."""
        if "://" not in url:
            return url
        slash_pos = url.find("/", url.find("://") + 3)
        if slash_pos == -1:
            return "/"
        return url[slash_pos:]

    @staticmethod
    def _sanitize_headers(headers: dict[str, Any] | None) -> dict[str, Any]:
        """Masking header sensitif sebelum disimpan ke audit log."""
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

    def _safe_mark_success(
        self,
        request_log,
        response_status_code: int,
        response_headers: dict[str, Any],
        response_payload: Any,
    ) -> None:
        """Update log sukses tanpa memblokir flow utama jika logging gagal."""
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
        """Update log gagal tanpa memblokir flow utama jika logging gagal."""
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
