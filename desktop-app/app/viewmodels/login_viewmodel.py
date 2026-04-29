"""Login ViewModel for managing login form state and actions."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.exceptions import ValidationError
from app.schemas.auth_schema import UserProfileDTO
from app.services.auth_service import AuthService


@dataclass(slots=True)
class LoginState:
    """UI state for login page."""

    is_loading: bool = False
    error_message: str | None = None


class LoginViewModel:
    """Handle login validation and authentication flow."""

    def __init__(self, auth_service: AuthService) -> None:
        """Initialize viewmodel with auth service dependency."""
        self._auth_service = auth_service
        self.state = LoginState()

    def validate(self, email: str, password: str) -> None:
        """Run lightweight UX validation before API request."""
        if not email.strip():
            raise ValidationError("Email wajib diisi.")
        if not password.strip():
            raise ValidationError("Password wajib diisi.")

    def login(self, email: str, password: str) -> UserProfileDTO:
        """Perform login and update state based on execution outcome."""
        self.state.is_loading = True
        self.state.error_message = None
        try:
            self.validate(email, password)
            return self._auth_service.login(email=email.strip(), password=password)
        except Exception as exc:
            self.state.error_message = str(exc)
            raise
        finally:
            self.state.is_loading = False

    def clear_error(self) -> None:
        """Reset error state in login viewmodel."""
        self.state.error_message = None