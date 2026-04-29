"""Warehouse buildup page placeholder for operator workflow."""

from __future__ import annotations

from PySide6.QtWidgets import QLabel, QVBoxLayout, QWidget


class BuildupView(QWidget):
    """Simple placeholder page for buildup module integration."""

    def __init__(self) -> None:
        """Build buildup page layout."""
        super().__init__()
        label = QLabel("Module Buildup akan dihubungkan ke endpoint backend secara bertahap.")
        label.setWordWrap(True)

        layout = QVBoxLayout()
        layout.addWidget(label)
        self.setLayout(layout)