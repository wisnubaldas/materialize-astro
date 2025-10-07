# app/services/redis_service.py
import redis.asyncio as redis

# konfigurasi sederhana
REDIS_URL = "redis://localhost:6379/0"

rds = redis.from_url(REDIS_URL, decode_responses=True)
