import time
import hmac
import hashlib
import base64

SECRET_KEY = "supersecret"

def create_token(username: str) -> str:
    payload = f"{username}:{int(time.time())}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(payload.encode() + b"." + signature).decode()
    return token

def verify_token(token: str) -> str | None:
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode(errors="ignore")
        payload, sig = decoded.rsplit(".", 1)
        expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest()
        if hmac.compare_digest(expected_sig, sig.encode(errors="ignore")):
            username, ts = payload.split(":")
            return username
    except Exception:
        return None
