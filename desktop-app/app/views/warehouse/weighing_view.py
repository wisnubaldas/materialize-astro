"""Warehouse weighing page placeholder for operator workflow."""

from __future__ import annotations

from PySide6.QtWidgets import QLabel, QVBoxLayout, QWidget


class WeighingView(QWidget):
    """Simple placeholder page for weighing module integration."""

    def __init__(self) -> None:
        """Build weighing page layout."""
        super().__init__()
        label = QLabel("Module Weighing akan dihubungkan ke endpoint backend secara bertahap.")
        label.setWordWrap(True)

        layout = QVBoxLayout()
        layout.addWidget(label)
        self.setLayout(layout)