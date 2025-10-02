from fastapi import APIRouter

from app.api import angkasapura_route, auth, hubnet

router = APIRouter()
router.include_router(auth.router)
router.include_router(angkasapura_route.router)
router.include_router(hubnet.router)
