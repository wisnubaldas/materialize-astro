"""Exception standar untuk modul integrasi CEISA."""

from fastapi import HTTPException


class CeisaIntegrationError(Exception):
    """Base exception untuk kegagalan integrasi CEISA."""

    def __init__(self, detail: str, status_code: int = 502):
        """Inisialisasi exception integrasi CEISA."""
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)

    def to_http_exception(self) -> HTTPException:
        """Konversi exception ke HTTPException FastAPI."""
        return HTTPException(status_code=self.status_code, detail=self.detail)


class CeisaConfigurationError(CeisaIntegrationError):
    """Exception untuk kesalahan konfigurasi CEISA."""

    def __init__(self, detail: str):
        """Inisialisasi error konfigurasi dengan status 500."""
        super().__init__(detail=detail, status_code=500)


class CeisaNotFoundError(CeisaIntegrationError):
    """Exception saat resource CEISA tidak ditemukan."""

    def __init__(self, detail: str):
        """Inisialisasi error not found dengan status 404."""
        super().__init__(detail=detail, status_code=404)

