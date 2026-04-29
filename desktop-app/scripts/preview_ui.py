"""Preview Qt Designer `.ui` file with the same qt-material theme as runtime app."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from PySide6.QtCore import QFile
from PySide6.QtUiTools import QUiLoader
from PySide6.QtWidgets import QApplication, QWidget
from qt_material import apply_stylesheet

from app.core.config import AppConfig


def load_widget(ui_path: Path) -> QWidget:
    """Load QWidget from Qt Designer `.ui` file."""
    file = QFile(str(ui_path))
    if not file.open(QFile.ReadOnly):
        raise RuntimeError(f"Gagal membuka file UI: {ui_path}")

    try:
        widget = QUiLoader().load(file)
    finally:
        file.close()

    if widget is None:
        raise RuntimeError(f"Gagal memuat file UI: {ui_path}")
    return widget


def main() -> int:
    """Run standalone themed preview for a `.ui` file."""
    parser = argparse.ArgumentParser(description="Preview .ui with qt-material theme.")
    parser.add_argument(
        "ui_file",
        nargs="?",
        default="app/resources/ui/login_view.ui",
        help="Path ke file .ui (default: app/resources/ui/login_view.ui)",
    )
    args = parser.parse_args()

    ui_path = Path(args.ui_file).resolve()
    if not ui_path.exists():
        raise FileNotFoundError(f"UI file tidak ditemukan: {ui_path}")

    config = AppConfig.load()
    app = QApplication(sys.argv)
    css_override_path = Path(__file__).resolve().parents[1] / "app" / "resources" / "styles" / "qt_material_overrides.css"
    apply_stylesheet(
        app,
        theme=config.ui_theme,
        extra={"density_scale": config.ui_density_scale},
        css_file=str(css_override_path),
    )

    widget = load_widget(ui_path)
    widget.setWindowTitle(f"Preview - {ui_path.name}")
    widget.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())

