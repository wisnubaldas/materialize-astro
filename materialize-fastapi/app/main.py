from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.openapi.utils import get_openapi
from app.api import routes
from app.utils.logging_config import setup_logging
from app.api.middleware.auth_middleware import JWTMiddleware
setup_logging()

app = FastAPI(title="FastAPI App with Poetry")
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
origins = [
    "http://localhost:4321",  # Ganti dengan origin frontend Anda
    "http://127.0.0.1:4321",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    JWTMiddleware
)
app.include_router(routes.router)
@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
