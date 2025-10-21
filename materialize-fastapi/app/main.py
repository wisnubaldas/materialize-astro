from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
from starlette.middleware.sessions import SessionMiddleware

from app.api import routes
from app.api.middleware.auth_middleware import JWTMiddleware
from app.utils.logging_config import setup_logging

# app
app = FastAPI(title="FastAPI App with Poetry")


# register_exception_handlers(app)
@app.on_event("startup")
async def startup():
    # init logging first so subsequent logs are captured
    setup_logging()


# error handler

# Setup Skema OpenAPI dengan JWT Auth
bearer_scheme = HTTPBearer()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="API RA",
        version="1.0.0",
        description="API untuk integrasi RA dan eksternal",
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

# middleware CORS di handle apache
origins = [
    "http://110.239.87.173:4321",
    "http://localhost:4321",  # Ganti dengan origin frontend Anda
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
# (Opsional) jika pakai server-side session Starlette
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
