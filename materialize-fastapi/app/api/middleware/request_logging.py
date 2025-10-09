import logging
import time

from fastapi import Request


class RequestLoggingMiddleware:
    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger("request")

    async def __call__(self, scope, receive, send):  # type: ignore[override]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive=receive)
        method = request.method
        path = request.url.path
        client = request.client.host if request.client else "-"

        start = time.perf_counter()
        status_code_holder = {"code": None}

        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                status_code_holder["code"] = message.get("status")
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)
            status = status_code_holder["code"] or 0
            self.logger.info(
                "%s %s %s %dms",
                client,
                method,
                path,
                duration_ms,
            )
