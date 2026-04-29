"""Centralized HTTP client wrapper for all desktop API requests."""

from __future__ import annotations

from typing import Any, Callable

import httpx

from app.core.exceptions import (
    ApiError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    UnauthorizedError,
)


class HttpClient:
    """Single API wrapper that handles timeout, auth headers, and common status mapping."""

    def __init__(
        self,
        base_url: str,
        timeout_seconds: float,
        on_unauthorized: Callable[[], None] | None = None,
    ) -> None:
        """Initialize HTTP client with fixed base URL and timeout."""
        self._on_unauthorized = on_unauthorized
        self._client = httpx.Client(
            base_url=base_url,
            timeout=httpx.Timeout(timeout_seconds),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )

    def set_bearer_token(self, token: str | None) -> None:
        """Attach or remove bearer token from default request headers."""
        if token:
            self._client.headers["Authorization"] = f"Bearer {token}"
            return
        self._client.headers.pop("Authorization", None)

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        """Send GET request and return JSON payload."""
        response = self._client.get(path, params=params)
        return self._parse_response(response)

    def post(self, path: str, json_payload: dict[str, Any] | None = None) -> Any:
        """Send POST request and return JSON payload."""
        if json_payload is None:
            response = self._client.post(path)
        else:
            response = self._client.post(path, json=json_payload)
        return self._parse_response(response)

    def delete(self, path: str) -> Any:
        """Send DELETE request and return JSON payload when available."""
        response = self._client.delete(path)
        return self._parse_response(response)

    def close(self) -> None:
        """Close underlying HTTP client resources."""
        self._client.close()

    def _parse_response(self, response: httpx.Response) -> Any:
        """Validate response and convert it to JSON payload."""
        if 200 <= response.status_code < 300:
            if response.status_code == 204:
                return None
            return response.json()

        detail = "API request failed"
        try:
            payload = response.json()
            detail = payload.get("detail") or payload.get("message") or detail
        except ValueError:
            if response.text:
                detail = response.text

        status_code = response.status_code
        if status_code == 401:
            if self._on_unauthorized:
                self._on_unauthorized()
            raise UnauthorizedError(detail, status_code=401)
        if status_code == 403:
            raise ForbiddenError(detail, status_code=403)
        if status_code == 404:
            raise NotFoundError(detail, status_code=404)
        if status_code == 409:
            raise ConflictError(detail, status_code=409)
        if status_code == 429:
            raise RateLimitError(detail, status_code=429)
        if status_code in {400, 422, 500}:
            raise ApiError(detail, status_code=status_code)

        raise ApiError(f"Unexpected status code: {status_code} - {detail}", status_code=status_code)
