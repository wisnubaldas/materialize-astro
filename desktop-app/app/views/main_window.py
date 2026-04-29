"""Main application window with stacked operational pages."""

from __future__ import annotations

from PySide6.QtWidgets import (
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QStackedWidget,
    QWidget,
)

from app.utils.formatter import format_roles
from app.viewmodels.main_viewmodel import MainViewModel
from app.views.ui_loader import load_ui_widget
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

        self._ui_root = load_ui_widget("main_window.ui", self)
        self.setCentralWidget(self._ui_root)

        self._user_info = self._require_child(QLabel, "userInfoLabel")
        self._menu_list = self._require_child(QListWidget, "menuList")
        self._stack = self._require_child(QStackedWidget, "stackPages")
        logout_button = self._require_child(QPushButton, "logoutButton")
        self._weighing_page = self._require_child(QWidget, "weighingPage")
        self._buildup_page = self._require_child(QWidget, "buildupPage")

        self._user_info.setText(
            f"User: {self._viewmodel.profile.username}\nRoles: {format_roles(self._viewmodel.profile.roles)}"
        )
        self._menu_list.addItem(QListWidgetItem("Dashboard"))
        self._menu_list.addItem(QListWidgetItem("Warehouse Weighing"))
        self._menu_list.addItem(QListWidgetItem("Warehouse Buildup"))

        logout_button.clicked.connect(self._on_logout_clicked)
        self._mount_page_widget(self._weighing_page, WeighingView())
        self._mount_page_widget(self._buildup_page, BuildupView())
        self._menu_list.currentRowChanged.connect(self._on_menu_changed)
        self._menu_list.setCurrentRow(0)

    def _require_child(self, widget_type: type, name: str):
        """Return required child widget by object name or raise runtime error."""
        widget = self._ui_root.findChild(widget_type, name)
        if widget is None:
            raise RuntimeError(f"Komponen UI wajib tidak ditemukan: {name}")
        return widget

    def _mount_page_widget(self, page: QWidget, widget: QWidget) -> None:
        """Attach a content widget into page layout from Qt Designer."""
        layout = page.layout()
        if layout is None:
            raise RuntimeError("Halaman stack wajib memiliki layout.")
        while layout.count():
            item = layout.takeAt(0)
            child = item.widget()
            if child is not None:
                child.deleteLater()
        layout.addWidget(widget)

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
