from fastapi import FastAPI
from app.api import routes,auth

app = FastAPI(title="FastAPI App with Poetry")

app.include_router(routes.router)
app.include_router(auth.router)
@app.get("/")
def root():
    return {"message": "Hello FastAPI with Poetry!"}
