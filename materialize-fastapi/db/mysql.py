# app/database.py
from sqlalchemy import create_engine, text

# Konfigurasi koneksi database MySQL
# Format: mysql+pymysql://<user>:<password>@<host>:<port>/<database>
DATABASE_URL = "mysql+pymysql://root:baldas@localhost:3306/materialize"

# Buat engine database secara sinkron
try:
    engine = create_engine(DATABASE_URL)
    # Verifikasi koneksi ke database
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Koneksi database ke MySQL berhasil.")
except Exception as e:
    print(
        "ERROR: Gagal terhubung ke database. Pastikan MySQL berjalan dan kredensial sudah benar."
    )
    print(f"Detail error: {e}")
    engine = None

# Mock database pengguna sebagai contoh.
# Di proyek nyata, data ini akan diambil dari tabel di database.
from .models import UserInDB

MOCK_USERS_DB = {
    "testuser@example.com": UserInDB(
        id=1,
        email="testuser@example.com",
        password_hash="$2b$12$Ea2w934c2N.z0T8D4y4XkOf.eP8A.rT9k4S.g.fL6f.g.hL.oK",
    )
}
