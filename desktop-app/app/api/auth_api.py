"""Auth-specific API wrapper."""

from __future__ import annotations

from app.api.http_client import HttpClient
from app.schemas.auth_schema import LoginRequestDTO, TokenDTO, UserProfileDTO


class AuthApi:
    """HTTP wrapper for auth endpoints exposed by FastAPI backend."""

    def __init__(self, http_client: HttpClient) -> None:
        """Initialize API wrapper with shared HTTP client."""
        self._http = http_client

    def login(self, payload: LoginRequestDTO) -> TokenDTO:
        """Authenticate with `/auth/login` and return token DTO."""
        raw = self._http.post("/auth/login", json_payload=payload.model_dump())
        return TokenDTO.model_validate(raw)

    def me(self) -> UserProfileDTO:
        """Fetch current authenticated user profile from `/auth/me`."""
        raw = self._http.get("/auth/me")
        return UserProfileDTO.model_validate(raw)

    def logout(self) -> None:
        """Call backend logout endpoint and clear server cookie state."""
        self._http.post("/auth/logout", json_payload=None)