from fastapi import APIRouter
from app.api import auth, angkasapura_route

router = APIRouter()
router.include_router(auth.router)
router.include_router(angkasapura_route.router)


