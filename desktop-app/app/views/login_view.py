"""Login page widget with keyboard-first input and async login action."""

from __future__ import annotations

from typing import Any

from PySide6.QtCore import Signal
from PySide6.QtWidgets import QFormLayout, QLabel, QLineEdit, QPushButton, QVBoxLayout, QWidget

from app.core.worker import run_in_thread
from app.schemas.auth_schema import UserProfileDTO
from app.viewmodels.login_viewmodel import LoginViewModel


class LoginView(QWidget):
    """Render login form and trigger non-blocking authentication flow."""

    login_succeeded = Signal(object)

    def __init__(self, viewmodel: LoginViewModel) -> None:
        """Initialize login widget and bind UI events."""
        super().__init__()
        self._viewmodel = viewmodel
        self._thread = None

        self.setWindowTitle("MAU APP - Login")
        self._status_label = QLabel("")
        self._email_input = QLineEdit()
        self._email_input.setPlaceholderText("Email")

        self._password_input = QLineEdit()
        self._password_input.setEchoMode(QLineEdit.Password)
        self._password_input.setPlaceholderText("Password")
        self._password_input.returnPressed.connect(self._on_login_clicked)

        self._login_button = QPushButton("Login")
        self._login_button.clicked.connect(self._on_login_clicked)

        form_layout = QFormLayout()
        form_layout.addRow("Email", self._email_input)
        form_layout.addRow("Password", self._password_input)

        root_layout = QVBoxLayout()
        root_layout.addLayout(form_layout)
        root_layout.addWidget(self._login_button)
        root_layout.addWidget(self._status_label)
        self.setLayout(root_layout)
        self.resize(420, 180)

    def _set_loading(self, is_loading: bool) -> None:
        """Toggle loading UI state."""
        self._email_input.setDisabled(is_loading)
        self._password_input.setDisabled(is_loading)
        self._login_button.setDisabled(is_loading)
        self._login_button.setText("Loading..." if is_loading else "Login")

    def _on_login_clicked(self) -> None:
        """Trigger asynchronous login execution."""
        self._status_label.setText("")
        self._set_loading(True)
        self._thread, _ = run_in_thread(
            self._viewmodel.login,
            self._on_login_result,
            self._on_login_error,
            self._on_login_finished,
            self._email_input.text(),
            self._password_input.text(),
        )

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
        """Restore form state once async login execution is complete."""
        self._set_loading(False)