# FastAPI Project

This is a FastAPI project structured to provide a clean and organized way to build APIs.

## Project Structure

```
fastapi-project
├── app
│   ├── main.py          # Entry point of the FastAPI application
│   ├── api              # Directory for API routes
│   │   └── __init__.py  # API route definitions
│   ├── models           # Directory for data models
│   │   └── __init__.py  # Data model definitions
│   └── schemas          # Directory for Pydantic schemas
│       └── __init__.py  # Data validation and serialization schemas
├── pyproject.toml       # Project configuration and dependencies
└── README.md            # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd fastapi-project
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the FastAPI application, execute the following command:

```
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` to access the interactive API documentation.

## Migrasi
```bash
alembic revision --autogenerate -m "Deskripsi migrasi Anda"
## Manual (membuat "blank" revision)
alembic revision -m "Deskripsi migrasi Anda"
## Menerapkan Migrasi (Apply)
alembic upgrade head
## Jika Anda perlu kembali (rollback) ke revisi sebelumnya, Anda bisa menggunakan perintah
alembic downgrade -1
```

## Faker & Seed
```python
## app/db/seeder.py
from faker import Faker
from sqlalchemy.orm import Session
from app.db.mysql import SessionLocal
from app.models.user_model import User
from app.utils.helpers import hash_password
import secrets

fake = Faker()

def seed_users(n: int = 10):
    db: Session = SessionLocal()
    try:
        for _ in range(n):
            username = fake.user_name()
            password = hash_password("password123")  # semua sample pakai default password
            token = secrets.token_hex(16)
            refresh_token = secrets.token_hex(32)

            user = User(
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

if __name__ == "__main__":
    seed_users(20)  # generate 20 user sample

```
```bash
## Cara Jalankan Seeder
python -m app.db.seeder
```