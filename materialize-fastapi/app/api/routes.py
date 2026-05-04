from fastapi import APIRouter

from app.api import angkasapura, auth, ceisa, edi, hubnet, setting, sse, tpsonline, warehouse

router = APIRouter()
router.include_router(auth.router)
router.include_router(angkasapura.router)
router.include_router(hubnet.router)
router.include_router(sse.router)
router.include_router(edi.router)
router.include_router(warehouse.router)
router.include_router(tpsonline.router)
router.include_router(setting.router)
router.include_router(ceisa.router)
