"""Reusable UI style helpers for desktop widgets."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QFile
from PySide6.QtWidgets import QApplication, QPushButton


def apply_app_stylesheet(app: QApplication) -> None:
    """Load and apply global QSS stylesheet from app resources."""
    resource_path = ":/styles/styles/app.qss"
    qss_file = QFile(resource_path)
    if qss_file.open(QFile.ReadOnly | QFile.Text):
        try:
            qss_content = bytes(qss_file.readAll()).decode("utf-8")
            app.setStyleSheet(qss_content)
            return
        finally:
            qss_file.close()

    style_path = Path(__file__).resolve().parents[1] / "resources" / "styles" / "app.qss"
    if style_path.exists():
        app.setStyleSheet(style_path.read_text(encoding="utf-8"))


def set_button_variant(button: QPushButton, variant: str) -> None:
    """Assign button style variant (e.g. `primary`, `danger`, `ghost`)."""
    button.setProperty("variant", variant)
    style = button.style()
    if style is not None:
        style.unpolish(button)
        style.polish(button)
    button.update()
