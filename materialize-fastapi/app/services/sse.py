import asyncio
from collections.abc import AsyncIterator
from contextlib import suppress

from redis.asyncio import Redis

HEARTBEAT_SEC = 15


def format_sse(data: str, event: str | None = None, id_: str | None = None) -> str:
    # https://html.spec.whatwg.org/multipage/server-sent-events.html
    out = []
    if id_:
        out.append(f"id: {id_}")
    if event:
        out.append(f"event: {event}")
    # data bisa multi-baris
    for line in data.splitlines() or [""]:
        out.append(f"data: {line}")
    out.append("")  # end of message
    return "\n".join(out)


async def redis_pubsub_to_sse(rds: Redis, channel: str) -> AsyncIterator[bytes]:
    pubsub = rds.pubsub()
    await pubsub.subscribe(channel)
    last_event_id = 0
    hb_task: asyncio.Task | None = None
    try:
        async def heartbeat():
            while True:
                await asyncio.sleep(HEARTBEAT_SEC)
                yield_bytes = (format_sse("[heartbeat]", event="ping")).encode("utf-8") + b"\n"
                yield yield_bytes  # type: ignore

        hb = heartbeat()
        hb_task = asyncio.create_task(hb.__anext__())

        while True:
            msg_task = asyncio.create_task(
                pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            )
            await asyncio.wait({msg_task, hb_task}, return_when=asyncio.FIRST_COMPLETED)

            if hb_task.done() and not hb_task.cancelled():
                yield hb_task.result()
                hb_task = asyncio.create_task(hb.__anext__())

            if msg_task.done():
                msg = msg_task.result()
                if msg is None:
                    continue
                last_event_id += 1
                payload = msg["data"]
                chunk = (
                    format_sse(payload, event="snapshot", id_=str(last_event_id))
                ).encode("utf-8") + b"\n"
                yield chunk
            else:
                msg_task.cancel()
                with suppress(asyncio.CancelledError):
                    await msg_task
    finally:
        if hb_task is not None:
            hb_task.cancel()
            with suppress(asyncio.CancelledError):
                await hb_task
        await pubsub.unsubscribe(channel)
        await pubsub.close()
