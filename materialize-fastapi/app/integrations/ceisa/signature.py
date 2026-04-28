"""Helper signature webhook CEISA (HMAC SHA256)."""

from __future__ import annotations

import hashlib
import hmac


def build_hmac_sha256_signature(secret: str, payload: bytes) -> str:
    """Bangun signature hexdigest HMAC SHA256 dari payload."""
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def verify_hmac_sha256_signature(secret: str, payload: bytes, signature: str | None) -> bool:
    """Validasi signature webhook dengan safe compare."""
    if not secret or not signature:
        return False
    expected = build_hmac_sha256_signature(secret=secret, payload=payload)
    return hmac.compare_digest(expected, signature.strip())

