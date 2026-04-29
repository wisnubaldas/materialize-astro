"""Desktop entrypoint that wires dependencies and starts Qt application."""

from __future__ import annotations

import logging
import sys

from PySide6.QtWidgets import QApplication
from qt_material import apply_stylesheet

from app.api.auth_api import AuthApi
from app.api.http_client import HttpClient
from app.api.warehouse_api import WarehouseApi
from app.core.config import AppConfig
from app.core.session import SessionState
from app.core.token_store import TokenStore
from app.services.auth_service import AuthService
from app.services.warehouse_service import WarehouseService
from app.viewmodels.login_viewmodel import LoginViewModel
from app.viewmodels.main_viewmodel import MainViewModel
from app.viewmodels.warehouse_viewmodel import WarehouseViewModel
from app.views.login_view import LoginView
from app.views.main_window import MainWindow


def bootstrap() -> int:
    """Initialize dependencies, apply UI theme, and run desktop application loop."""
    config = AppConfig.load()
    if config.app_debug:
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        )
        logging.getLogger("httpx").setLevel(logging.DEBUG)
        logging.getLogger("httpcore").setLevel(logging.DEBUG)
        logging.debug("Desktop debug mode enabled")
        logging.debug("API base URL: %s", config.api_base_url)
        logging.debug("API timeout seconds: %s", config.api_timeout_seconds)

    app = QApplication(sys.argv)
    apply_stylesheet(app, theme="light_blue.xml")

    session = SessionState()
    token_store = TokenStore()

    def on_unauthorized() -> None:
        """Clear local auth state when API returns 401 Unauthorized."""
        token_store.clear()
        session.clear()

    http_client = HttpClient(
        base_url=config.api_base_url,
        timeout_seconds=config.api_timeout_seconds,
        on_unauthorized=on_unauthorized,
    )

    auth_api = AuthApi(http_client)
    warehouse_api = WarehouseApi(http_client)

    auth_service = AuthService(auth_api, http_client, session, token_store)
    warehouse_service = WarehouseService(warehouse_api)
    _ = WarehouseViewModel(warehouse_service)

    login_vm = LoginViewModel(auth_service)
    login_view = LoginView(login_vm)

    windows: list[MainWindow] = []

    def open_main_window(profile) -> None:
        main_vm = MainViewModel(auth_service=auth_service, profile=profile)
        main_window = MainWindow(main_vm)
        windows.append(main_window)
        login_view.hide()
        main_window.show()

    login_view.login_succeeded.connect(open_main_window)
    login_view.show()

    exit_code = app.exec()
    http_client.close()
    return exit_code


if __name__ == "__main__":
    raise SystemExit(bootstrap())
