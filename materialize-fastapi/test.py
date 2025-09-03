# File: main.py
# Deskripsi: Proyek starter FastAPI dengan otentikasi JWT, koneksi database MySQL, dan dokumentasi Swagger UI.

from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from jose import jwt, JWTError

# --- Konfigurasi Proyek ---
# PENTING: Gunakan variabel lingkungan untuk menyimpan nilai sensitif seperti SECRET_KEY dan kredensial database.
# Untuk demo ini, nilai-nilai tersebut ditulis langsung.
SECRET_KEY = "ini-adalah-secret-key-yang-sangat-rahasia"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# --- Konfigurasi Database ---
# Format koneksi: mysql+pymysql://<user>:<password>@<host>:<port>/<database>
DB_URL = "mysql+pymysql://root:baldas@localhost:3306/materialize"

try:
    engine = create_engine(DB_URL, echo=True)
    # Coba koneksi ke database untuk memastikan semuanya berfungsi
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Koneksi database ke MySQL berhasil!")
except Exception as e:
    print(f"Gagal terhubung ke database: {e}")
    # Jika koneksi gagal, aplikasi akan tetap berjalan, tetapi endpoint yang memerlukan database akan gagal.
    # Dalam produksi, Anda mungkin ingin menghentikan aplikasi jika ini terjadi.


# --- Skema Data (Pydantic Models) ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    token_type: str = "access"


class UserLogin(BaseModel):
    email: str
    password: str


class User(BaseModel):
    id: int
    email: EmailStr
    password_hash: str


# Mock Database Pengguna
# Di proyek nyata, ini akan menjadi tabel di database Anda.
mock_users_db = {
    "testuser@example.com": User(
        id=1,
        email="testuser@example.com",
        password_hash="$2b$12$Ea2w934c2N.z0T8D4y4XkOf.eP8A.rT9k4S.g.fL6f.g.hL.oK",
    )
}

# --- Utilitas Otentikasi dan JWT ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_password_hash(password: str) -> str:
    """Mengembalikan hash password yang diberikan."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memverifikasi password biasa dengan password yang di-hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Membuat token akses JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire, "token_type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Membuat token refresh JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "token_type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Dependency untuk mendapatkan pengguna saat ini dari token akses."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Tidak dapat memvalidasi kredensial",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # pyright: ignore[reportAssignmentType]
        token_type: str = payload.get("token_type")  # pyright: ignore[reportAssignmentType]
        if email is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = mock_users_db.get(email)
    if user is None:
        raise credentials_exception

    return user


# --- Aplikasi FastAPI ---
app = FastAPI(
    title="Proyek Starter FastAPI",
    description="Proyek starter dengan otentikasi JWT dan koneksi database MySQL.",
    version="1.0.0",
)

# --- Routes/Endpoints ---


@app.get("/")
def read_root():
    """Endpoint dasar yang dapat diakses publik."""
    return {"message": "Selamat datang di proyek starter FastAPI!"}


@app.post("/token", response_model=Token)
async def create_token(user_data: UserLogin):
    """
    Buat token akses dan refresh untuk otentikasi.

    - **email**: Email pengguna.
    - **password**: Password pengguna.
    """
    user = mock_users_db.get(user_data.email)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )

    return {"access_token": access_token, "refresh_token": refresh_token}


@app.post("/token/refresh", response_model=Token)
async def refresh_token(token: str = Depends(oauth2_scheme)):
    """
    Refresh token akses menggunakan refresh token yang ada.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # type: ignore
        token_type: str = payload.get("token_type")  # type: ignore
        if email is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = mock_users_db.get(email)
    if user is None:
        raise credentials_exception

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token}


@app.get("/verify", response_model=TokenPayload)
async def verify_token(token: str = Depends(oauth2_scheme)):
    """
    Verifikasi token akses dan kembalikan payload-nya.

    - **Requires**: Token akses valid di header `Authorization`.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/protected", response_model=dict)
async def protected_route(current_user: User = Depends(get_current_user)):
    """
    Contoh rute yang dilindungi.

    - **Requires**: Token akses valid di header `Authorization`.
    """
    return {
        "message": f"Halo, {current_user.email}! Anda berhasil mengakses rute yang dilindungi."
    }


# --- Jalankan Aplikasi ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
