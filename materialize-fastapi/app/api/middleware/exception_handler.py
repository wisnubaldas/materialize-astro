import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.utils.api_response import (
    build_error_response,
    map_http_detail_errors,
    map_validation_errors,
)

logger = logging.getLogger()


def _resolve_message(detail: object, fallback: str) -> str:
    if isinstance(detail, str):
        return detail
    return fallback


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        errors = map_http_detail_errors(exc.detail)
        default_message = "Request gagal diproses"
        if exc.status_code == 401:
            default_message = "Unauthorized"
        elif exc.status_code >= 500:
            default_message = "Terjadi kesalahan pada server"

        message = _resolve_message(exc.detail, default_message)
        logger.warning(
            "HTTPException path=%s status=%s message=%s",
            request.url.path,
            exc.status_code,
            message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(message=message, errors=errors),
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        errors = map_validation_errors(exc.errors())
        logger.warning("ValidationError path=%s total_errors=%s", request.url.path, len(errors))
        return JSONResponse(
            status_code=422,
            content=build_error_response(message="Validasi gagal", errors=errors),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception path=%s", request.url.path, exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=build_error_response(message="Terjadi kesalahan pada server"),
        )
