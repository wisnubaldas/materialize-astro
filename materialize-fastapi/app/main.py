from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer

from app.api import routes
from app.api.middleware.auth_middleware import JWTMiddleware
from app.utils.logging_config import setup_logging
from app.utils.scheduler import start_scheduler, stop_scheduler

# app
app = FastAPI(title="FastAPI App with Poetry")


# register_exception_handlers(app)
@app.on_event("startup")
async def startup():
    # init logging first so subsequent logs are captured
    setup_logging()
    await start_scheduler()


@app.on_event("shutdown")
async def shutdown():
    await stop_scheduler()


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
    "http://localhost:4321",  # Ganti dengan origin frontend Anda
    "http://127.0.0.1:4321",
    "https://app.mitraadira.com",
    "https://api.mitraadira.com",
    "https://mitraadira.com",
    "http://110.239.87.173:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_origin_regex=r"https://.*\.mitraadira\.com",
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)

# routes
app.include_router(routes.router)


@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
