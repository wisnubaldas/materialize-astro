"""Warehouse weighing page placeholder for operator workflow."""

from __future__ import annotations

from PySide6.QtWidgets import QLabel, QLineEdit, QPushButton, QVBoxLayout, QWidget

from app.views.ui_loader import load_ui_widget


class WeighingView(QWidget):
    """Simple placeholder page for weighing module integration."""

    def __init__(self) -> None:
        """Build weighing page layout."""
        super().__init__()
        self._ui_root = load_ui_widget("warehouse/weighing_view.ui", self)
        root_layout = QVBoxLayout(self)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.addWidget(self._ui_root)

        self._master_awb_input = self._require_child(QLineEdit, "masterAwbInput")
        self._weight_input = self._require_child(QLineEdit, "weightInput")
        self._save_button = self._require_child(QPushButton, "saveButton")
        self._clear_button = self._require_child(QPushButton, "clearButton")
        self._status_label = self._require_child(QLabel, "statusLabel")

        self._save_button.clicked.connect(self._on_save_clicked)
        self._clear_button.clicked.connect(self._on_clear_clicked)

    def _require_child(self, widget_type: type, name: str):
        """Return required child widget by object name or raise runtime error."""
        widget = self._ui_root.findChild(widget_type, name)
        if widget is None:
            raise RuntimeError(f"Komponen UI wajib tidak ditemukan: {name}")
        return widget

    def _on_save_clicked(self) -> None:
        """Handle local save action placeholder until API module is connected."""
        self._status_label.setText("Integrasi save weighing belum aktif pada milestone ini.")

    def _on_clear_clicked(self) -> None:
        """Reset local input fields for faster operator retry."""
        self._master_awb_input.clear()
        self._weight_input.clear()
        self._status_label.setText("Form weighing di-reset.")
