"""Shared text formatting utilities for desktop UI rendering."""

from __future__ import annotations


def format_roles(roles: list[str]) -> str:
    """Format role list for concise user-facing display."""
    if not roles:
        return "-"
    return ", ".join(sorted(roles))