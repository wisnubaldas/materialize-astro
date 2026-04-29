"""Utility helpers to load Qt Designer `.ui` files safely."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QFile
from PySide6.QtUiTools import QUiLoader
from PySide6.QtWidgets import QWidget

UI_DIR = Path(__file__).resolve().parents[1] / "resources" / "ui"


def load_ui_widget(filename: str, parent: QWidget | None = None) -> QWidget:
    """Load a `.ui` file from desktop resources and return the root widget."""
    ui_path = UI_DIR / filename
    if not ui_path.exists():
        raise FileNotFoundError(f"UI file tidak ditemukan: {ui_path}")

    file = QFile(str(ui_path))
    if not file.open(QFile.ReadOnly):
        raise RuntimeError(f"Gagal membuka file UI: {ui_path}")

    try:
        loader = QUiLoader()
        widget = loader.load(file, parent)
    finally:
        file.close()

    if widget is None:
        raise RuntimeError(f"Gagal memuat file UI: {ui_path}")
    return widget

