# app/api/sse_route.py
import redis.asyncio as redis
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.crypto_service import decrypt_key

REDIS_URL = "redis://localhost:6379/0"
router = APIRouter(prefix="/sse", tags=["Routing untuk SSE server-sent event"])


async def redis_to_sse(channel: str):
    rds = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = rds.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                yield f"data: {data}\n\n"
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()


@router.get("/fibonacci")
async def stream_fibonacci(key: str):
    """
    Endpoint SSE dengan verifikasi key terenkripsi dari client Astro
    """
    print(f"🔑 Key diterima (Base64): {key}")
    try:
        payload = decrypt_key(key)
        # print(f"🔑 Payload dari key: {payload}")
        user = payload.get("user")
        print(f"📡 SSE Connected by: {user}")
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))  # noqa: B904

    return StreamingResponse(redis_to_sse("fibonacci_channel"), media_type="text/event-stream")


@router.get("/arithmetic")
async def stream_arithmetic(key: str):
    payload = decrypt_key(key)
    print(f"📡 SSE Arithmetic Connected by {payload['user']}")
    return StreamingResponse(redis_to_sse("arithmetic_channel"), media_type="text/event-stream")


@router.get("/geometric")
async def stream_geometric(key: str):
    payload = decrypt_key(key)
    print(f"📡 SSE Geometric Connected by {payload['user']}")
    return StreamingResponse(redis_to_sse("geometric_channel"), media_type="text/event-stream")


@router.get("/power")
async def stream_power(key: str):
    payload = decrypt_key(key)
    print(f"📡 SSE Power Connected by {payload['user']}")
    return StreamingResponse(redis_to_sse("power_channel"), media_type="text/event-stream")


@router.get("/factorial")
async def stream_factorial(key: str):
    payload = decrypt_key(key)
    print(f"📡 SSE Factorial Connected by {payload['user']}")
    return StreamingResponse(redis_to_sse("factorial_channel"), media_type="text/event-stream")
