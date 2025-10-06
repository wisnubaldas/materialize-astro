from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

from app.api import routes
from app.api.middleware.auth_middleware import JWTMiddleware

# from app.utils.logging_config import setup_logging

# setup_logging()

# app
app = FastAPI(title="FastAPI App with Poetry")
# register_exception_handlers(app)

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

# middleware
origins = [
    "http://localhost:4321",  # Ganti dengan origin frontend Anda
    "http://127.0.0.1:4321",
    "https://ap2.mitraadira.com",
    "https://mitraadira.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)

# routes
app.include_router(routes.router)


@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
