from faker import Faker
from sqlalchemy.orm import Session
from app.db.mysql import SessionDB1W
from app.models.user import User
from app.utils.auth_util import hash_password
import secrets

fake = Faker()

def seed_users(n: int = 10):
    db: Session = SessionDB1W()
    try:
        for _ in range(n):
            email = fake.email()
            username = fake.user_name()
            password = hash_password("password123")  # semua sample pakai default password
            token = secrets.token_hex(16)
            refresh_token = secrets.token_hex(32)

            user = User(
                email=email,
                username=username,
                password=password,
                token=token,
                refresh_token=refresh_token,
            )
            db.add(user)
        db.commit()
        print(f"✅ {n} users berhasil di-seed")
    finally:
        db.close()

def seed_inv(n: int = 10):
    pass

if __name__ == "__main__":
    seed_users(20)  # generate 20 user sample
