# app/api/monitor_route.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.db.redis_conn import get_redis
from app.services.monitor_service import CHANNEL_NAME
from app.services.sse import redis_pubsub_to_sse

router = APIRouter(prefix="/monitor", tags=["monitor"])


@router.get("/sse")
async def monitor_sse():
    rds = get_redis()

    async def event_gen():
        async for chunk in redis_pubsub_to_sse(rds, CHANNEL_NAME):
            yield chunk

    return StreamingResponse(event_gen(), media_type="text/event-stream")
