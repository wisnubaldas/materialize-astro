"""PyQt6 desktop application for USB HID barcode scanner operations.

This module implements a focused barcode input field that captures rapid key
events from a scanner device (keyboard emulation), finalizes data on Enter,
validates barcodes against an in-memory dictionary, and displays scan logs.
"""

from __future__ import annotations

import sys
from datetime import datetime

from PyQt6.QtCore import QEvent, QObject, Qt, QTimer
from PyQt6.QtGui import QKeyEvent
from PyQt6.QtWidgets import (
    QApplication,
    QLabel,
    QLineEdit,
    QListWidget,
    QMainWindow,
    QVBoxLayout,
    QWidget,
)


class BarcodeScannerWindow(QMainWindow):
    """Main window for barcode scanning and validation."""

    def __init__(self) -> None:
        """Initialize window, scanner buffer, registry, and widgets."""
        super().__init__()
        self.setWindowTitle("Barcode Scanner")
        self.resize(760, 520)

        self._scan_buffer = ""
        self._barcode_registry = self._build_barcode_registry()

        self._focus_timer: QTimer | None = None
        self.barcode_input: QLineEdit
        self.status_label: QLabel
        self.log_list: QListWidget

        self._setup_ui()
        self._setup_focus_guard()

    @staticmethod
    def _build_barcode_registry() -> dict[str, dict[str, str]]:
        """Create simple in-memory barcode registry as database simulation."""
        return {
            "899999000001": {"item_name": "Cargo Label A", "location": "WH-A1"},
            "899999000002": {"item_name": "Cargo Label B", "location": "WH-B3"},
            "899999000003": {"item_name": "Cargo Label C", "location": "WH-C2"},
            "899999000004": {"item_name": "Cargo Label D", "location": "WH-D5"},
            "8886008101053": {"item_name": "Cargo Label E", "location": "WH-E3"},
        }

    def _setup_ui(self) -> None:
        """Build and arrange UI components."""
        wrapper = QWidget()
        layout = QVBoxLayout(wrapper)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(12)

        title = QLabel("Scanner Input (USB HID Keyboard Mode)")
        title.setStyleSheet("font-size: 16px; font-weight: 600;")

        self.barcode_input = QLineEdit()
        self.barcode_input.setPlaceholderText(
            "Scan barcode di sini (akan otomatis diproses saat Enter)"
        )
        self.barcode_input.setClearButtonEnabled(False)
        self.barcode_input.setMaxLength(256)
        self.barcode_input.installEventFilter(self)

        self.status_label = QLabel("Status: Menunggu scan...")
        self.status_label.setStyleSheet("color: #0f5f9c; font-weight: 500;")

        self.log_list = QListWidget()
        self.log_list.setAlternatingRowColors(True)

        layout.addWidget(title)
        layout.addWidget(self.barcode_input)
        layout.addWidget(self.status_label)
        layout.addWidget(self.log_list)

        self.setCentralWidget(wrapper)

    def _setup_focus_guard(self) -> None:
        """Keep barcode input focused so scanner can keep sending characters."""
        self._focus_timer = QTimer(self)
        self._focus_timer.setInterval(250)
        self._focus_timer.timeout.connect(self._ensure_input_focus)
        self._focus_timer.start()
        self._ensure_input_focus()

    def _ensure_input_focus(self) -> None:
        """Force focus back to input if it moves away."""
        if not self.barcode_input.hasFocus():
            self.barcode_input.setFocus(Qt.FocusReason.OtherFocusReason)

    def eventFilter(self, watched: QObject, event: QEvent) -> bool:
        """Intercept key events from barcode input for fast scanner handling."""
        if watched is self.barcode_input and event.type() == QEvent.Type.KeyPress:
            return self._handle_keypress(event)  # type: ignore[arg-type]
        return super().eventFilter(watched, event)

    def _handle_keypress(self, event: QKeyEvent) -> bool:
        """Handle every keypress and finalize scan when Enter is detected."""
        key = event.key()
        if key in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            self._commit_scan()
            return True

        if key == Qt.Key.Key_Backspace:
            self._scan_buffer = self._scan_buffer[:-1]
            self.barcode_input.setText(self._scan_buffer)
            return True

        text = event.text()
        if text and text.isprintable():
            self._scan_buffer += text
            self.barcode_input.setText(self._scan_buffer)
            return True

        # Consume other keys so focus/input behavior stays stable in operation.
        return True

    def _commit_scan(self) -> None:
        """Finalize a scanned barcode, validate it, and write a log entry."""
        barcode_value = self._scan_buffer.strip()
        if not barcode_value:
            self._set_status("Status: Barcode kosong, scan diabaikan.", None)
            self.barcode_input.clear()
            return

        found = self._barcode_registry.get(barcode_value)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if found:
            log_text = (
                f"[{now}] {barcode_value} | TERDAFTAR | "
                f"Item={found['item_name']} | Lokasi={found['location']}"
            )
            self._set_status(f"Status: Barcode {barcode_value} terdaftar.", True)
        else:
            log_text = f"[{now}] {barcode_value} | TIDAK TERDAFTAR"
            self._set_status(f"Status: Barcode {barcode_value} tidak terdaftar.", False)

        self.log_list.insertItem(0, log_text)
        self._scan_buffer = ""
        self.barcode_input.clear()
        self._ensure_input_focus()

    def _set_status(self, message: str, known: bool | None) -> None:
        """Update status message and color based on validation result."""
        if known is True:
            style = "color: #1f7a1f; font-weight: 600;"
        elif known is False:
            style = "color: #b91c1c; font-weight: 600;"
        else:
            style = "color: #9a6700; font-weight: 600;"

        self.status_label.setText(message)
        self.status_label.setStyleSheet(style)


def run_app() -> int:
    """Run the PyQt6 application loop."""
    app = QApplication(sys.argv)
    window = BarcodeScannerWindow()
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(run_app())
