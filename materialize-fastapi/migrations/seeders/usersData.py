from faker import Faker
import jwt
from datetime import datetime, timezone, timedelta
from app.utils.env import ENV
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password):
    return pwd_context.hash(password)


fuck = Faker()
payload = {"user_id": fuck.uuid4(), "exp": datetime.now(timezone.utc) + timedelta(seconds=20)}


datas = [
    {
        "username": "wisnubaldas",
        "email": "wisnubaldas@gmail.com",
        "password": hash_password("password123"),
        "token": jwt.encode(payload, ENV.SECRET_KEY, algorithm="HS256"),
    }
]
for i in range(10):
    datas.append(
        {
            "username": fuck.name(),
            "email": fuck.email(),
            "password": hash_password("password123"),
            "token": jwt.encode(payload, ENV.SECRET_KEY, algorithm="HS256"),
        }
    )
USERS = datas
