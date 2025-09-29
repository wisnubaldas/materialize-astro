from contextlib import contextmanager

import redis

r = redis.Redis.from_url("redis://localhost:6379/0")

@contextmanager
def redis_lock(lock_name: str, expire: int = 300):
    """
    Membuat redis lock untuk mencegah task overlap
    expire = 300 detik (5 menit) -> otomatis hilang kalau worker crash
    """
    if r.set(lock_name, "1", nx=True, ex=expire):
        try:
            yield True
        finally:
            r.delete(lock_name)
    else:
        yield False
