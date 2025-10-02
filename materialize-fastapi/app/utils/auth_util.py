from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.utils.env import ENV

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ENV.ACCESS_TOKEN_EXPIRE_MINUTES)
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
