"""Unit tests for authentication service."""

from __future__ import annotations

from unittest.mock import Mock

from app.schemas.auth_schema import TokenDTO, UserProfileDTO
from app.services.auth_service import AuthService


def test_auth_service_login_updates_session_and_token_store() -> None:
    """Verify login updates session, token store, and bearer header."""
    auth_api = Mock()
    http_client = Mock()
    session = Mock(access_token=None, profile=None)
    token_store = Mock()

    auth_api.login.return_value = TokenDTO(access_token="abc", token_type="bearer")
    auth_api.me.return_value = UserProfileDTO(id=1, username="ops", email="ops@example.com", roles=["operator"])

    service = AuthService(auth_api, http_client, session, token_store)

    profile = service.login("ops@example.com", "secret")

    assert profile.username == "ops"
    http_client.set_bearer_token.assert_called_once_with("abc")
    token_store.save.assert_called_once_with("abc")
    assert session.access_token == "abc"


def test_auth_service_restore_session_returns_none_when_missing_token() -> None:
    """Verify restore session exits gracefully when no persisted token."""
    auth_api = Mock()
    http_client = Mock()
    session = Mock(access_token=None, profile=None)
    token_store = Mock()
    token_store.load.return_value = None

    service = AuthService(auth_api, http_client, session, token_store)

    assert service.restore_session() is None
    auth_api.me.assert_not_called()