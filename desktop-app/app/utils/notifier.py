"""UI notification helpers using Qt message boxes."""

from __future__ import annotations

from PySide6.QtWidgets import QMessageBox, QWidget


def show_error(parent: QWidget | None, title: str, message: str) -> None:
    """Display error dialog with concise message."""
    QMessageBox.critical(parent, title, message)


def show_info(parent: QWidget | None, title: str, message: str) -> None:
    """Display informational dialog with concise message."""
    QMessageBox.information(parent, title, message)