# app/core/redis_conn.py
import os
from functools import lru_cache

from redis.asyncio import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/5")


@lru_cache
def get_redis() -> Redis:
    # Single shared asyncio client
    return Redis.from_url(REDIS_URL, decode_responses=True)
