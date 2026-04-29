"""Authentication use cases for desktop application."""

from __future__ import annotations

from app.api.auth_api import AuthApi
from app.api.http_client import HttpClient
from app.core.session import SessionState
from app.core.token_store import TokenStore
from app.schemas.auth_schema import LoginRequestDTO, UserProfileDTO


class AuthService:
    """Orchestrate desktop auth flow between API, session, and token storage."""

    def __init__(
        self,
        auth_api: AuthApi,
        http_client: HttpClient,
        session: SessionState,
        token_store: TokenStore,
    ) -> None:
        """Initialize auth service dependencies."""
        self._auth_api = auth_api
        self._http_client = http_client
        self._session = session
        self._token_store = token_store

    def login(self, email: str, password: str) -> UserProfileDTO:
        """Execute login flow and return authenticated user profile."""
        token = self._auth_api.login(LoginRequestDTO(email=email, password=password))
        self._http_client.set_bearer_token(token.access_token)
        profile = self._auth_api.me()

        self._session.access_token = token.access_token
        self._session.profile = profile
        self._token_store.save(token.access_token)
        return profile

    def restore_session(self) -> UserProfileDTO | None:
        """Restore persisted token and fetch profile when available."""
        token = self._token_store.load()
        if not token:
            return None

        self._http_client.set_bearer_token(token)
        profile = self._auth_api.me()
        self._session.access_token = token
        self._session.profile = profile
        return profile

    def logout(self) -> None:
        """Clear backend and local session/token state."""
        try:
            self._auth_api.logout()
        except Exception:  # noqa: BLE001
            pass
        self._http_client.set_bearer_token(None)
        self._token_store.clear()
        self._session.clear()