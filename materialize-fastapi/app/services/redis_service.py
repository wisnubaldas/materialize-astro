# app/services/redis_service.py
from typing import Any

import redis.asyncio as redis

# konfigurasi sederhana
REDIS_URL = "redis://localhost:6379/0"

rds = redis.from_url(REDIS_URL, decode_responses=True)


def publish_sync(channel: str, message: Any) -> None:
    """Publish a message to Redis Pub/Sub using a synchronous client.

    Useful from synchronous contexts (e.g., APScheduler jobs) to avoid
    interacting with the running asyncio loop.
    """
    try:
        # Local import to avoid clobbering the async import alias
        import redis as redis_sync  # type: ignore

        client = redis_sync.Redis.from_url(REDIS_URL, decode_responses=True)
        try:
            client.publish(channel, message)
        finally:
            try:  # noqa: SIM105
                client.close()
            except Exception:
                pass
    except Exception:
        # As a library util, avoid raising here; caller can log if needed
        pass
