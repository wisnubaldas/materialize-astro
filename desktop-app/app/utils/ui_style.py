"""Reusable UI style helpers for desktop widgets."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtWidgets import QApplication, QPushButton


def apply_app_stylesheet(app: QApplication) -> None:
    """Load and apply global QSS stylesheet from app resources."""
    style_path = Path(__file__).resolve().parents[1] / "resources" / "styles" / "app.qss"
    if not style_path.exists():
        return
    app.setStyleSheet(style_path.read_text(encoding="utf-8"))


def set_button_variant(button: QPushButton, variant: str) -> None:
    """Assign button style variant (e.g. `primary`, `danger`, `ghost`)."""
    button.setProperty("variant", variant)
    style = button.style()
    if style is not None:
        style.unpolish(button)
        style.polish(button)
    button.update()

