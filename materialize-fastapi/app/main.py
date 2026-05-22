import logging
import os
import platform
import socket
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api import routes
from app.api.middleware.auth_middleware import JWTMiddleware
from app.api.middleware.exception_handler import register_exception_handlers
from app.api.middleware.request_logging import RequestLoggingMiddleware
from app.utils.env import ENV
from app.utils.helper import EMAIL_TEMPLATE_DIR, PDF_DIR
from app.utils.logging_config import setup_logging

logger = logging.getLogger(__name__)


def get_debug_cors_origins() -> list[str]:
    """Return local Ionic dev origins allowed only when APP_DEBUG is enabled."""
    host_candidates = {"localhost", "127.0.0.1"}

    try:
        host_candidates.update(socket.gethostbyname_ex(socket.gethostname())[2])
    except OSError:
        logger.debug("Tidak dapat membaca IP lokal dari hostname untuk CORS debug.", exc_info=True)

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe_socket:
            probe_socket.connect(("8.8.8.8", 80))
            host_candidates.add(probe_socket.getsockname()[0])
    except OSError:
        logger.debug("Tidak dapat membaca IP LAN aktif untuk CORS debug.", exc_info=True)

    return [f"http://{host}:8100" for host in sorted(host_candidates) if host]


# Set timezone environment variable
os.environ["TZ"] = "Asia/Jakarta"

# Hanya jalankan tzset() jika OS mendukung
if hasattr(time := __import__("time"), "tzset") and platform.system() != "Windows":
    time.tzset()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kode sebelum 'yield' adalah event startup
    setup_logging()  # init logging first so subsequent logs are captured
    logger.info("Application startup completed")
    yield  # Aplikasi mulai menerima request di titik ini
    # Kode setelah 'yield' adalah event shutdown (opsional)
    # Tambahkan logika cleanup di sini jika diperlukan
    logger.info("Application shutdown")


# app
app = FastAPI(
    lifespan=lifespan,
    title="FastAPI App with Poetry",
    docs_url="/docs" if ENV.APP_DEBUG else None,
    redoc_url="/redoc" if ENV.APP_DEBUG else None,
    openapi_url="/openapi.json" if ENV.APP_DEBUG else None,
)
# Setup Skema OpenAPI dengan JWT Auth
bearer_scheme = HTTPBearer()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="MAU APP",
        version="1.0.0",
        description="API Aplikasi MAU",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# middleware CORS
default_origins = [
    "http://110.239.87.173:4321",
    "http://localhost:4321",  # origin frontend default
    "http://127.0.0.1:4321",
    "https://app.mitraadira.com",
    "https://mitraadira.com",
    "http://localhost:8100",
    "http://127.0.0.1:8100",
    "http://192.168.1.7:8081",
    "http://192.168.5.224:8081",
]
debug_origins = get_debug_cors_origins()
raw_origins = (ENV.CORS_ALLOW_ORIGINS or "").strip()
configured_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
origins = configured_origins or default_origins

if ENV.APP_DEBUG:
    origins = list(dict.fromkeys([*origins, *debug_origins]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Set-Cookie"],  # opsional
    max_age=86400,  # cache preflight 1 hari
)

# NOTE: untuk cookie cross-site → SameSite=None; Secure
app.add_middleware(
    SessionMiddleware,
    secret_key="ganti_dengan_secret_yang_kuat",
    same_site="none",
    https_only=True,
    domain=".mitraadira.com",  # agar berlaku untuk subdomain
)

app.add_middleware(JWTMiddleware)
app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)


# Header keamanan & Vary
@app.middleware("http")
async def security_headers(request, call_next):
    resp = await call_next(request)
    # Kebijakan referer default modern (aman)
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Izinkan resource diakses lintas origin (jika perlu)
    # (kalau kamu serving image/file statis yang mau di-embed)
    resp.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    # Lindungi dari opener hijacking untuk window.open
    resp.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    # Penting untuk CORS + CDN/Cloudflare
    resp.headers["Vary"] = "Origin"
    return resp


# routes
app.include_router(routes.router)

# public path
app.mount("/pdf", StaticFiles(directory=PDF_DIR), name="pdf")
app.mount("/assets", StaticFiles(directory=EMAIL_TEMPLATE_DIR), name="assets")


@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
