# app/api/sse_route.py
import asyncio
import json

import redis.asyncio as redis
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.services.crypto_service import decrypt_key
from app.services.inv_ap2_service import INVAp2Service, UPLOAD_INVOICE_AP2_CHANNEL
from app.services.sse_service import SSEUTIL

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


@router.get("/sending-ke-hubnet")
async def stream_sending_ke_hubnet(key: str):
    try:
        decrypt_key(key)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))  # noqa: B904

    return StreamingResponse(
        redis_to_sse("sending_ke_hubnet_channel"), media_type="text/event-stream"
    )


@router.get("/log-send-invoice-ap2")
async def log_send_invoice_ap2(key: str):
    try:
        decrypt_key(key)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))  # noqa: B904

    return StreamingResponse(
        redis_to_sse("send_invoice_ap2_channel"), media_type="text/event-stream"
    )


async def _upload_invoice_excel_event_stream():
    current_status = INVAp2Service.get_upload_invoice_excel_job_status()
    yield f"data: {json.dumps(current_status)}\n\n"
    async for event in redis_to_sse(UPLOAD_INVOICE_AP2_CHANNEL):
        yield event


@router.get("/angkasapura-upload-invoice")
async def angkasapura_upload_invoice(key: str):
    try:
        decrypt_key(key)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))  # noqa: B904

    return StreamingResponse(_upload_invoice_excel_event_stream(), media_type="text/event-stream")


LOG_PATH = "logs/app.log"


async def __log_event_stream():
    last_sent = None
    try:
        while True:
            logs = SSEUTIL.read_last_json_lines(LOG_PATH, 100)
            # hanya kirim jika berubah (tidak broadcast spam)
            if logs != last_sent:
                last_sent = logs
                data = json.dumps(logs)
                yield f"data: {data}\n\n"

            await asyncio.sleep(5)  # interval cek log
    except asyncio.CancelledError:
        print("SSE client disconnected")
        raise


@router.get("/log-app", summary="menampilkan log dari semua log aplikasi")
async def log_app(_request: Request, key: str):
    try:
        decrypt_key(key)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))  # noqa: B904
    return StreamingResponse(__log_event_stream(), media_type="text/event-stream")

# @router.get("/arithmetic")
# async def stream_arithmetic(key: str):
#     payload = decrypt_key(key)
#     print(f"📡 SSE Arithmetic Connected by {payload['user']}")
#     return StreamingResponse(redis_to_sse("arithmetic_channel"), media_type="text/event-stream")


# @router.get("/geometric")
# async def stream_geometric(key: str):
#     payload = decrypt_key(key)
#     print(f"📡 SSE Geometric Connected by {payload['user']}")
#     return StreamingResponse(redis_to_sse("geometric_channel"), media_type="text/event-stream")


# @router.get("/power")
# async def stream_power(key: str):
#     payload = decrypt_key(key)
#     print(f"📡 SSE Power Connected by {payload['user']}")
#     return StreamingResponse(redis_to_sse("power_channel"), media_type="text/event-stream")


# @router.get("/factorial")
# async def stream_factorial(key: str):
#     payload = decrypt_key(key)
#     print(f"📡 SSE Factorial Connected by {payload['user']}")
#     return StreamingResponse(redis_to_sse("factorial_channel"), media_type="text/event-stream")
