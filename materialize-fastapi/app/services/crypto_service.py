# app/services/crypto_service.py
import base64
import json
from datetime import datetime, timedelta

# app/services/crypto_service.py
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

# from cryptography.fernet import Fernet, InvalidToken

# Gunakan kunci rahasia panjang minimal 32 byte
# Biasanya kamu ambil dari ENV agar tetap konsisten di backend & frontend
# SECRET_KEY = ENV.SSE_KEY.encode("utf-8")  # type: ignore
# FERNET_KEY = base64.urlsafe_b64encode(SECRET_KEY[:32])
# fernet = Fernet(FERNET_KEY)

SECRET_KEY = bytes.fromhex(
    "92a936af44d2c94d919c0d0800f6617b008c4d1817a1981aeb0ecf3cad3373fa"
)  # sama seperti di .env Astro
IV = b"1234567890123456"  # IV statis hanya untuk demo (sebaiknya acak per token)


def encrypt_key(data: dict, expire_seconds: int = 30) -> str:
    """
    Enkripsi dict jadi string terenkripsi.
    Data bisa berupa {"user": "wisnu", "ts": "..."}.
    """
    data["exp"] = (datetime.utcnow() + timedelta(seconds=expire_seconds)).timestamp()  # noqa: DTZ003
    plain = json.dumps(data).encode()
    # return fernet.encrypt(token).decode()
    cipher = AES.new(SECRET_KEY[:32], AES.MODE_CBC, IV)
    ct_bytes = cipher.encrypt(pad(plain, AES.block_size))
    return base64.b64encode(ct_bytes).decode()


def decrypt_key(token: str) -> dict:
    """
    Dekripsi token menjadi dict, dan cek expired.
    """
    try:
        cipher = AES.new(SECRET_KEY[:32], AES.MODE_CBC, IV)
        decoded = base64.b64decode(token)
        plain = unpad(cipher.decrypt(decoded), AES.block_size)
        data = json.loads(plain)
        exp = datetime.utcfromtimestamp(data["exp"])  # noqa: DTZ004
        if exp < datetime.utcnow():  # noqa: DTZ003
            raise ValueError("Expired key")
        return data
    except Exception as e:
        raise ValueError(f"Invalid key: {e}")  # noqa: B904
