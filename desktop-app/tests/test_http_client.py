"""Unit tests for centralized HTTP client wrapper."""

from __future__ import annotations

import pytest

from app.api.http_client import HttpClient
from app.core.exceptions import ForbiddenError, UnauthorizedError


class DummyResponse:
    """Simple response object for parser-only tests."""

    def __init__(self, status_code: int, payload: dict | None = None, text: str = "") -> None:
        """Create response-like object with status and payload."""
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        """Return payload as JSON-like object."""
        if self._payload is None:
            raise ValueError("No JSON")
        return self._payload


def test_set_bearer_token_updates_headers() -> None:
    """Ensure bearer token setter mutates Authorization header correctly."""
    client = HttpClient(base_url="http://localhost:8000", timeout_seconds=5)
    client.set_bearer_token("abc")
    assert client._client.headers["Authorization"] == "Bearer abc"
    client.set_bearer_token(None)
    assert "Authorization" not in client._client.headers
    client.close()


def test_parse_response_raises_unauthorized_and_calls_hook() -> None:
    """Ensure unauthorized status maps to `UnauthorizedError` and executes hook."""
    called = {"value": False}

    def mark_called() -> None:
        called["value"] = True

    client = HttpClient(base_url="http://localhost:8000", timeout_seconds=5, on_unauthorized=mark_called)
    with pytest.raises(UnauthorizedError):
        client._parse_response(DummyResponse(401, {"detail": "Unauthorized"}))
    assert called["value"] is True
    client.close()


def test_parse_response_raises_forbidden() -> None:
    """Ensure forbidden status maps to `ForbiddenError`."""
    client = HttpClient(base_url="http://localhost:8000", timeout_seconds=5)
    with pytest.raises(ForbiddenError):
        client._parse_response(DummyResponse(403, {"detail": "Forbidden"}))
    client.close()


def test_parse_response_returns_json_for_success_status() -> None:
    """Ensure parser returns JSON payload for success status."""
    client = HttpClient(base_url="http://localhost:8000", timeout_seconds=5)
    result = client._parse_response(DummyResponse(200, {"hello": "world"}))
    assert result == {"hello": "world"}
    client.close()