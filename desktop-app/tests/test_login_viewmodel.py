"""Unit tests for login viewmodel validation and state changes."""

from __future__ import annotations

from unittest.mock import Mock

import pytest

from app.core.exceptions import ValidationError
from app.schemas.auth_schema import UserProfileDTO
from app.viewmodels.login_viewmodel import LoginViewModel


def test_login_viewmodel_validation_requires_email_and_password() -> None:
    """Ensure local validation rejects empty email/password fields."""
    vm = LoginViewModel(auth_service=Mock())
    with pytest.raises(ValidationError):
        vm.validate("", "pass")
    with pytest.raises(ValidationError):
        vm.validate("ops@example.com", "")


def test_login_viewmodel_login_returns_profile_and_clears_loading() -> None:
    """Ensure successful login returns profile and loading state resets."""
    auth_service = Mock()
    auth_service.login.return_value = UserProfileDTO(
        id=1,
        username="ops",
        email="ops@example.com",
        roles=["operator"],
    )
    vm = LoginViewModel(auth_service=auth_service)

    profile = vm.login("ops@example.com", "secret")

    assert profile.username == "ops"
    assert vm.state.is_loading is False
    assert vm.state.error_message is None