from fastapi import FastAPI
from app.api import routes,auth
from fastapi.middleware.cors import CORSMiddleware

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
app.include_router(auth.router)
@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
