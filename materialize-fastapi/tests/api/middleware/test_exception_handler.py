import logging

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.middleware.exception_handler import register_exception_handlers


def test_unhandled_exception_returns_safe_500_response(caplog):
    """Ensure unexpected server errors are masked from API clients."""
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/boom")
    def boom():
        raise RuntimeError("PDF render failed because template asset is missing")

    client = TestClient(app, raise_server_exceptions=False)

    with caplog.at_level(logging.ERROR):
        response = client.get("/boom")

    assert response.status_code == 500
    assert response.json() == {
        "status": "error",
        "message": "Terjadi kesalahan pada server",
        "errors": [],
    }
    assert "Unhandled exception path=/boom" in caplog.text
    assert "PDF render failed because template asset is missing" in caplog.text
