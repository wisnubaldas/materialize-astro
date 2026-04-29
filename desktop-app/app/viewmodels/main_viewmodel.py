"""Main window ViewModel for authenticated user context."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.auth_schema import UserProfileDTO
from app.services.auth_service import AuthService


@dataclass(slots=True)
class MainState:
    """Main window state for current user and active page."""

    current_page: str = "dashboard"


class MainViewModel:
    """Manage main window state and logout action."""

    def __init__(self, auth_service: AuthService, profile: UserProfileDTO) -> None:
        """Initialize main state using authenticated profile."""
        self._auth_service = auth_service
        self.profile = profile
        self.state = MainState()

    def set_page(self, page_name: str) -> None:
        """Update active page identifier."""
        self.state.current_page = page_name

    def logout(self) -> None:
        """Run logout use-case through auth service."""
        self._auth_service.logout()