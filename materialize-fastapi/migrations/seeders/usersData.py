from faker import Faker
import hashlib
import jwt
from datetime import datetime, timezone, timedelta


def hash_password_sha256(password):
    """Hashes a password using SHA-256."""
    # Encode the password string to bytes
    password_bytes = password.encode("utf-8")

    # Create a SHA-256 hash object
    sha256_hash = hashlib.sha256()

    # Update the hash object with the password bytes
    sha256_hash.update(password_bytes)

    # Get the hexadecimal representation of the hash
    hashed_password = sha256_hash.hexdigest()

    return hashed_password


fuck = Faker()
payload = {"user_id": fuck.uuid4(), "exp": datetime.now(timezone.utc) + timedelta(seconds=20)}

datas = []
SECRET_KEY = "banke rawa"
for i in range(10):
    datas.append(
        {
            "username": fuck.name(),
            "email": fuck.email(),
            "password": hash_password_sha256("password123"),
            "token": jwt.encode(payload, SECRET_KEY, algorithm="HS256"),
        }
    )
USERS = datas
