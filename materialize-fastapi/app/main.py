from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.api import routes
from app.utils.logging_config import setup_logging
setup_logging()

app = FastAPI(title="FastAPI App with Poetry")
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

app.include_router(routes.router)
@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
