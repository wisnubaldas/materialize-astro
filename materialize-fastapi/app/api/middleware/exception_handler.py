from pydantic import BaseModel
from typing import Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.error_schema import UnauthorizedResponse


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        if exc.status_code == 401:
            print(f"status code: {exc.status_code} ambil dari exception handler")
            return JSONResponse(
                status_code=401, content=UnauthorizedResponse(message=exc.detail).model_dump()
            )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
