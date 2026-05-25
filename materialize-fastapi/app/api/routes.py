from fastapi import APIRouter

from app.api import (
    angkasapura,
    auth,
    build_up_check,
    ceisa,
    edi,
    hubnet,
    openai_example,
    setting,
    sse,
    tpsonline,
)

router = APIRouter()
router.include_router(auth.router)
router.include_router(angkasapura.router)
router.include_router(hubnet.router)
router.include_router(sse.router)
router.include_router(edi.router)
router.include_router(build_up_check.router)
router.include_router(build_up_check.pdf_router)
router.include_router(tpsonline.router)
router.include_router(setting.router)
router.include_router(ceisa.router)
router.include_router(openai_example.router)
