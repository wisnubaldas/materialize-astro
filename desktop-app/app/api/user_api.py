"""User API wrapper for future user-centric endpoints."""

from __future__ import annotations

from app.api.http_client import HttpClient
from app.schemas.auth_schema import UserProfileDTO


class UserApi:
    """HTTP wrapper for user-related endpoints."""

    def __init__(self, http_client: HttpClient) -> None:
        """Initialize user API wrapper with shared HTTP client."""
        self._http = http_client

    def get_profile(self) -> UserProfileDTO:
        """Return authenticated user profile."""
        raw = self._http.get("/auth/me")
        return UserProfileDTO.model_validate(raw)