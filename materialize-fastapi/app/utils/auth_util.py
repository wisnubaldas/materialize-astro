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
    env_domain = (ENV.AUTH_COOKIE_DOMAIN or "").strip() if ENV.AUTH_COOKIE_DOMAIN else None
    domain = env_domain if env_domain else (".mitraadira.com" if ENV.APP_ENV == "production" else None)

    raw_same_site = (ENV.AUTH_COOKIE_SAMESITE or "").strip().lower() if ENV.AUTH_COOKIE_SAMESITE else None
    default_same_site = "none" if ENV.APP_ENV == "production" else "lax"
    same_site = raw_same_site if raw_same_site in {"lax", "strict", "none"} else default_same_site

    # default secure flag
    if ENV.AUTH_COOKIE_SECURE is None:
        secure = ENV.APP_ENV == "production"
    else:
        secure = bool(ENV.AUTH_COOKIE_SECURE)

    # SameSite=None mensyaratkan Secure=True
    if same_site == "none":
        secure = True

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite=same_site,  # type: ignore[arg-type]
        domain=domain,  # type: ignore[arg-type]
        max_age=60 * 60 * 24,  # 1 hari
        path="/",
    )
