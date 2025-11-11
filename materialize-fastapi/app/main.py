from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from starlette.middleware.sessions import SessionMiddleware

from app.api import routes
from app.api.middleware.auth_middleware import JWTMiddleware
from app.utils.env import ENV
from app.utils.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kode sebelum 'yield' adalah event startup
    setup_logging()  # init logging first so subsequent logs are captured
    yield  # Aplikasi mulai menerima request di titik ini
    # Kode setelah 'yield' adalah event shutdown (opsional)
    # Tambahkan logika cleanup di sini jika diperlukan
    print("Application shutdown")


# app
app = FastAPI(
    lifespan=lifespan,
    title="FastAPI App with Poetry",
    docs_url="/docs" if ENV.APP_DEBUG else None,
    redoc_url="/redoc" if ENV.APP_DEBUG else None,
    openapi_url="/openapi.json" if ENV.APP_DEBUG else None,
)
# error handler

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
raw_origins = (ENV.CORS_ALLOW_ORIGINS or "").strip()
if raw_origins:
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    origins = [
        "http://110.239.87.173:4321",
        "http://localhost:4321",  # origin frontend default
        "http://127.0.0.1:4321",
        "https://app.mitraadira.com",
        "https://mitraadira.com",
    ]

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


@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
