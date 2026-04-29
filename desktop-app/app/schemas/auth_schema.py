"""Authentication DTOs used by API, service, and viewmodel layers."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LoginRequestDTO(BaseModel):
    """Request payload for desktop login endpoint."""

    email: EmailStr
    password: str = Field(min_length=1)


class TokenDTO(BaseModel):
    """Token payload returned by backend login endpoint."""

    access_token: str
    token_type: str


class UserProfileDTO(BaseModel):
    """Authenticated user profile payload."""

    id: int
    username: str
    email: EmailStr
    roles: list[str] = Field(default_factory=list)