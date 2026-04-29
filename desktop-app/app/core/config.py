"""Configuration loader for the desktop application."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


@dataclass(slots=True)
class AppConfig:
    """Application runtime configuration loaded from environment variables."""

    api_base_url: str
    api_timeout_seconds: float
    app_env: str
    app_debug: bool

    @classmethod
    def load(cls, env_file: str | None = None) -> "AppConfig":
        """Load settings from `.env` file and environment variables."""
        if env_file:
            load_dotenv(env_file)
        else:
            desktop_env_path = Path(__file__).resolve().parents[2] / ".env"
            project_env_path = Path(__file__).resolve().parents[3] / ".env"
            if desktop_env_path.exists():
                load_dotenv(desktop_env_path, override=False)
            elif project_env_path.exists():
                load_dotenv(project_env_path, override=False)

        base_url = os.getenv("MAU_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        timeout = float(os.getenv("MAU_API_TIMEOUT_SECONDS", "15"))
        app_env = os.getenv("MAU_APP_ENV", "development")
        app_debug = os.getenv("MAU_APP_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
        return cls(
            api_base_url=base_url,
            api_timeout_seconds=timeout,
            app_env=app_env,
            app_debug=app_debug,
        )
