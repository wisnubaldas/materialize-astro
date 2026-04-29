"""Main application window with stacked operational pages."""

from __future__ import annotations

from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from app.utils.formatter import format_roles
from app.viewmodels.main_viewmodel import MainViewModel
from app.views.warehouse.buildup_view import BuildupView
from app.views.warehouse.weighing_view import WeighingView


class MainWindow(QMainWindow):
    """Render authenticated desktop shell with menu and content pages."""

    def __init__(self, viewmodel: MainViewModel) -> None:
        """Initialize main window with initial user profile context."""
        super().__init__()
        self._viewmodel = viewmodel
        self.setWindowTitle("MAU APP - Desktop")
        self.resize(1024, 640)

        container = QWidget()
        root_layout = QHBoxLayout(container)

        menu_layout = QVBoxLayout()
        self._user_info = QLabel(
            f"User: {self._viewmodel.profile.username}\nRoles: {format_roles(self._viewmodel.profile.roles)}"
        )
        self._menu_list = QListWidget()
        self._menu_list.addItem(QListWidgetItem("Dashboard"))
        self._menu_list.addItem(QListWidgetItem("Warehouse Weighing"))
        self._menu_list.addItem(QListWidgetItem("Warehouse Buildup"))
        self._menu_list.currentRowChanged.connect(self._on_menu_changed)
        self._menu_list.setCurrentRow(0)

        logout_button = QPushButton("Logout")
        logout_button.clicked.connect(self._on_logout_clicked)

        menu_layout.addWidget(self._user_info)
        menu_layout.addWidget(self._menu_list)
        menu_layout.addWidget(logout_button)
        menu_layout.addStretch()

        self._stack = QStackedWidget()
        dashboard_label = QLabel("Selamat datang di desktop MAU APP.")
        dashboard_label.setWordWrap(True)
        self._stack.addWidget(dashboard_label)
        self._stack.addWidget(WeighingView())
        self._stack.addWidget(BuildupView())

        root_layout.addLayout(menu_layout, 1)
        root_layout.addWidget(self._stack, 3)

        self.setCentralWidget(container)

    def _on_menu_changed(self, index: int) -> None:
        """Switch page by menu selection index."""
        if index < 0:
            return
        self._stack.setCurrentIndex(index)
        page_map = {0: "dashboard", 1: "weighing", 2: "buildup"}
        self._viewmodel.set_page(page_map.get(index, "dashboard"))

    def _on_logout_clicked(self) -> None:
        """Ask confirmation and execute logout."""
        answer = QMessageBox.question(
            self,
            "Konfirmasi Logout",
            "Apakah Anda yakin ingin logout?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if answer != QMessageBox.Yes:
            return
        self._viewmodel.logout()
        self.close()