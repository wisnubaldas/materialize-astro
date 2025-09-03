from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["API"])

@router.get("/ping")
def ping():
    return {"ping": "pong"}
