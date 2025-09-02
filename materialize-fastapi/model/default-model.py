# app/models.py
from pydantic import BaseModel, EmailStr
from datetime import datetime


class Token(BaseModel):
    """Skema untuk respons token otentikasi."""

    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class TokenPayload(BaseModel):
    """Payload yang akan disimpan di dalam token JWT."""

    sub: str
    exp: datetime
    token_type: str = "access"


class UserLogin(BaseModel):
    """Skema untuk data login pengguna."""

    email: EmailStr
    password: str


class UserInDB(BaseModel):
    """Skema untuk data pengguna yang disimpan di database."""

    id: int
    email: EmailStr
    password_hash: str
