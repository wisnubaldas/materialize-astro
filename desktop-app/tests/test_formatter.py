"""Unit tests for text formatter utility."""

from app.utils.formatter import format_roles


def test_format_roles_returns_dash_for_empty_list() -> None:
    """Ensure empty role list is represented by dash character."""
    assert format_roles([]) == "-"


def test_format_roles_sorts_and_joins_roles() -> None:
    """Ensure role list is sorted before being rendered."""
    assert format_roles(["operator", "admin"]) == "admin, operator"