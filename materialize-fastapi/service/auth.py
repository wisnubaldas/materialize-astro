# app/security.py
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt, JWTError

from .database import MOCK_USERS_DB
from .models import UserInDB

# --- Konfigurasi Otentikasi ---
# PENTING: Gunakan variabel lingkungan untuk menyimpan SECRET_KEY.
SECRET_KEY = os.getenv("SECRET_KEY", "ini-adalah-secret-key-yang-sangat-rahasia")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Konteks password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Skema otentikasi OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


# --- Fungsi Utilitas ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password biasa dengan password yang di-hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_jwt_token(
    data: Dict[str, Any], expires_delta: timedelta, token_type: str
) -> str:
    """Membuat token JWT dengan tipe dan waktu kedaluwarsa tertentu."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "token_type": token_type})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_access_token(data: Dict[str, Any]) -> str:
    """Membuat token akses."""
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_jwt_token(data, expires, "access")


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Membuat token refresh."""
    expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return create_jwt_token(data, expires, "refresh")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """Dependency untuk mendapatkan pengguna saat ini dari token akses."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Tidak dapat memvalidasi kredensial",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("token_type")
        if email is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = MOCK_USERS_DB.get(email)
    if user is None:
        raise credentials_exception

    return user
