"""Token storage utility with keyring-first strategy and file fallback."""

from __future__ import annotations

import json
from pathlib import Path

try:
    import keyring
except Exception:  # pragma: no cover - optional dependency at runtime
    keyring = None


class TokenStore:
    """Persist access token securely when possible and safely clear it on logout."""

    SERVICE_NAME = "mau-desktop-app"
    ACCOUNT_NAME = "access-token"

    def __init__(self, fallback_path: Path | None = None) -> None:
        """Initialize token store with optional fallback file path."""
        self._fallback_path = fallback_path or Path.home() / ".mau_desktop" / "session.json"

    def save(self, token: str) -> None:
        """Save token to OS keyring or fallback file."""
        if keyring is not None:
            keyring.set_password(self.SERVICE_NAME, self.ACCOUNT_NAME, token)
            return
        self._fallback_path.parent.mkdir(parents=True, exist_ok=True)
        self._fallback_path.write_text(json.dumps({"access_token": token}), encoding="utf-8")

    def load(self) -> str | None:
        """Load token from OS keyring or fallback file."""
        if keyring is not None:
            return keyring.get_password(self.SERVICE_NAME, self.ACCOUNT_NAME)
        if not self._fallback_path.exists():
            return None
        data = json.loads(self._fallback_path.read_text(encoding="utf-8"))
        return data.get("access_token")

    def clear(self) -> None:
        """Remove token from storage."""
        if keyring is not None:
            try:
                keyring.delete_password(self.SERVICE_NAME, self.ACCOUNT_NAME)
            except Exception:
                pass
            return
        if self._fallback_path.exists():
            self._fallback_path.unlink()