import logging
import time

from fastapi import Request

from app.utils.env import ENV


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
        query_string = request.url.query
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
            status_code = status_code_holder["code"] or 0
            should_log = (
                ENV.REQUEST_LOG_ALL
                or ENV.APP_DEBUG
                or status_code >= 400
                or duration_ms >= ENV.REQUEST_LOG_SLOW_MS
            )
            if not should_log:
                return

            route_path = "-"
            route = scope.get("route")
            if route is not None:
                route_path = getattr(route, "path", "-")
            full_path = path if not query_string else f"{path}?{query_string}"

            self.logger.info(
                "http_request %s %s route=%s status=%s duration_ms=%s",
                method,
                full_path,
                route_path,
                status_code,
                duration_ms,
                extra={
                    "event": "http.request",
                    "client_ip": client,
                    "method": method,
                    "path": path,
                    "query_string": query_string or None,
                    "route": route_path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                },
            )
