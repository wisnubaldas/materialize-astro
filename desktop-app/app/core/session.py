"""In-memory session state for desktop user context."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.auth_schema import UserProfileDTO


@dataclass(slots=True)
class SessionState:
    """Mutable in-memory session store for token and profile."""

    access_token: str | None = None
    profile: UserProfileDTO | None = None

    def is_authenticated(self) -> bool:
        """Return `True` when access token is available in memory."""
        return bool(self.access_token)

    def clear(self) -> None:
        """Clear all session state."""
        self.access_token = None
        self.profile = None