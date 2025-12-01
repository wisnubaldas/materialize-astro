import logging

from fastapi import APIRouter

from app.schemas.ffmSchema import FFMBase

router = APIRouter(prefix="/edi", tags=["Kirim Electronic data interchange"])
logger = logging.getLogger("edi")


@router.post("/ffm", summary="Kirim data FFM ke airlines via email")
def ffm(payload: FFMBase):
    pass
