import datetime
from datetime import timedelta

from fastapi import Response
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.utils.env import ENV

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(username: str) -> str:
    expire = datetime.datetime.now(tz=datetime.timezone.utc) + timedelta(
        minutes=ENV.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, ENV.SECRET_KEY, algorithm=ENV.ALGORITHM)


def verify_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, ENV.SECRET_KEY, algorithms=[ENV.ALGORITHM])
        username: str = payload.get("sub")  # type: ignore
        if username is None:
            return None
        return username
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def set_jwt_cookie(response: Response, token: str):
    """
    Set cookie JWT secara aman dengan environment-aware.
    """
    print(ENV.APP_ENV)
    if ENV.APP_ENV == "production":
        # cookie lintas subdomain (untuk mitraadira.com)
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,  # hanya via HTTPS
            samesite="none",  # agar dikirim lintas subdomain
            domain=".mitraadira.com",
            max_age=60 * 60 * 24,  # 1 hari
            path="/",
        )
    else:
        # local dev: tidak secure & tanpa domain
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,  # karena http://localhost
            samesite="lax",  # lebih aman daripada none di HTTP
            domain=None,  # wajib None agar cocok dengan localhost
            max_age=60 * 60 * 24,  # 1 hari
            path="/",
        )
