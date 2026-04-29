"""Warehouse buildup page placeholder for operator workflow."""

from __future__ import annotations

from PySide6.QtWidgets import QLabel, QLineEdit, QPushButton, QVBoxLayout, QWidget

from app.views.ui_loader import load_ui_widget


class BuildupView(QWidget):
    """Simple placeholder page for buildup module integration."""

    def __init__(self) -> None:
        """Build buildup page layout."""
        super().__init__()
        self._ui_root = load_ui_widget("warehouse/buildup_view.ui", self)
        root_layout = QVBoxLayout(self)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.addWidget(self._ui_root)

        self._master_awb_list_input = self._require_child(QLineEdit, "masterAwbListInput")
        self._lookup_button = self._require_child(QPushButton, "lookupButton")
        self._result_hint_label = self._require_child(QLabel, "resultHintLabel")

        self._lookup_button.clicked.connect(self._on_lookup_clicked)

    def _require_child(self, widget_type: type, name: str):
        """Return required child widget by object name or raise runtime error."""
        widget = self._ui_root.findChild(widget_type, name)
        if widget is None:
            raise RuntimeError(f"Komponen UI wajib tidak ditemukan: {name}")
        return widget

    def _on_lookup_clicked(self) -> None:
        """Handle lookup placeholder action until buildup table module is connected."""
        raw = self._master_awb_list_input.text().strip()
        if not raw:
            self._result_hint_label.setText("Masukkan minimal satu MasterAWB.")
            return
        self._result_hint_label.setText("Lookup buildup akan dihubungkan ke service API pada milestone berikutnya.")
