"""Domain-specific exceptions for desktop app workflows."""

from __future__ import annotations


class AppError(Exception):
    """Base exception for desktop application errors."""


class ValidationError(AppError):
    """Raised when local UX validation fails before sending API requests."""


class ApiError(AppError):
    """Raised when API returns an unexpected error response."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        """Initialize API error with optional HTTP status code."""
        super().__init__(message)
        self.status_code = status_code


class UnauthorizedError(ApiError):
    """Raised when API responds with 401 Unauthorized."""


class ForbiddenError(ApiError):
    """Raised when API responds with 403 Forbidden."""


class NotFoundError(ApiError):
    """Raised when API responds with 404 Not Found."""


class ConflictError(ApiError):
    """Raised when API responds with 409 Conflict."""


class RateLimitError(ApiError):
    """Raised when API responds with 429 Too Many Requests."""