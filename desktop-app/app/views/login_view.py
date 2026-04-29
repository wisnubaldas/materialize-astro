"""Login page widget with keyboard-first input and async login action."""

from __future__ import annotations

from typing import Any

from PySide6.QtCore import QThread
from PySide6.QtCore import Signal
from PySide6.QtWidgets import QLabel, QLineEdit, QPushButton, QVBoxLayout, QWidget

from app.core.worker import run_in_thread
from app.schemas.auth_schema import UserProfileDTO
from app.viewmodels.login_viewmodel import LoginViewModel
from app.views.ui_loader import load_ui_widget


class LoginView(QWidget):
    """Render login form and trigger non-blocking authentication flow."""

    login_succeeded = Signal(object)

    def __init__(self, viewmodel: LoginViewModel) -> None:
        """Initialize login widget and bind UI events."""
        super().__init__()
        self._viewmodel = viewmodel
        self._thread: QThread | None = None
        self._worker = None

        self._ui_root = load_ui_widget("login_view.ui", self)
        root_layout = QVBoxLayout(self)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.addWidget(self._ui_root)

        self._status_label = self._require_child(QLabel, "statusLabel")
        self._email_input = self._require_child(QLineEdit, "emailInput")
        self._password_input = self._require_child(QLineEdit, "passwordInput")
        self._login_button = self._require_child(QPushButton, "loginButton")

        self._password_input.returnPressed.connect(self._on_login_clicked)
        self._login_button.clicked.connect(self._on_login_clicked)

        self.setWindowTitle(self._ui_root.windowTitle())
        self.resize(420, 180)

    def _require_child(self, widget_type: type, name: str):
        """Return required child widget by object name or raise runtime error."""
        widget = self._ui_root.findChild(widget_type, name)
        if widget is None:
            raise RuntimeError(f"Komponen UI wajib tidak ditemukan: {name}")
        return widget

    def _set_loading(self, is_loading: bool) -> None:
        """Toggle loading UI state."""
        self._email_input.setDisabled(is_loading)
        self._password_input.setDisabled(is_loading)
        self._login_button.setDisabled(is_loading)
        self._login_button.setText("Loading..." if is_loading else "Login")

    def _on_login_clicked(self) -> None:
        """Trigger asynchronous login execution."""
        if self._thread is not None and self._thread.isRunning():
            return

        self._status_label.setText("")
        self._set_loading(True)
        self._thread, self._worker = run_in_thread(
            self._viewmodel.login,
            self._on_login_result,
            self._on_login_error,
            self._on_login_finished,
            self._email_input.text(),
            self._password_input.text(),
        )
        if self._thread is not None:
            self._thread.finished.connect(self._on_thread_finished)

    def _on_login_result(self, payload: Any) -> None:
        """Handle successful login result from worker."""
        profile = payload
        if isinstance(profile, UserProfileDTO):
            self._status_label.setText("Login berhasil.")
            self.login_succeeded.emit(profile)

    def _on_login_error(self, message: str) -> None:
        """Handle login failure and show concise error message."""
        self._status_label.setText(message or "Login gagal.")

    def _on_login_finished(self) -> None:
        """Restore form state once worker reports completion."""
        self._set_loading(False)

    def _on_thread_finished(self) -> None:
        """Release thread references only after QThread fully stops."""
        self._worker = None
        self._thread = None

    def closeEvent(self, event) -> None:  # noqa: N802
        """Ensure active worker thread is stopped before widget destruction."""
        if self._thread is not None and self._thread.isRunning():
            self._thread.quit()
            self._thread.wait(2000)
        super().closeEvent(event)
