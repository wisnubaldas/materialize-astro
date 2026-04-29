"""Export resolved qt-material stylesheet for Qt Designer preview usage."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtWidgets import QApplication
from qt_material import build_stylesheet

from app.core.config import AppConfig


def main() -> int:
    """Generate QSS file that can be loaded manually in Qt Designer preview."""
    app = QApplication.instance() or QApplication([])
    config = AppConfig.load()
    output_path = Path(__file__).resolve().parents[1] / "app" / "resources" / "styles" / "qt_material_designer_preview.qss"
    override_path = Path(__file__).resolve().parents[1] / "app" / "resources" / "styles" / "qt_material_overrides.css"

    qss = build_stylesheet(
        theme=config.ui_theme,
        extra={"density_scale": config.ui_density_scale},
    )
    if override_path.exists():
        qss = f"{qss}\n\n/* --- MAU custom overrides --- */\n{override_path.read_text(encoding='utf-8')}"

    output_path.write_text(qss, encoding="utf-8")
    print(f"Generated: {output_path}")
    app.quit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
