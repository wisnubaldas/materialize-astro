import logging

from fastapi import APIRouter, Depends

from app.deps.edi_deps import get_buildup_service, get_weighing_header_service
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.ffmSchema import FFMBase
from app.schemas.fhl_schema import FhlResponse
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.edi_service import EdiService

router = APIRouter(prefix="/edi", tags=["Kirim Electronic data interchange"])
logger = logging.getLogger("edi")


@router.post("/ffm", summary="Kirim data FFM ke airlines via email")
def ffm(payload: FFMBase):
    pass


@router.post(
    "/export-buildup",
    summary="grid data buildup export",
    response_model=DataTablesResponse[EksBuildUpDetailOut],
)
def export_buildup(params: DataTablesParams, service: EdiService = Depends(get_buildup_service)):
    return service.datatable(params)


@router.post(
    "/export-cwp",
    summary="grid data export CWP",
    response_model=DataTablesResponse[WeighingHeaderOut],
)
def export_cwp(
    params: DataTablesParams, service: EdiService = Depends(get_weighing_header_service)
):
    return service.weighing_datatables(params)


############### bikin format data IATA ######################
@router.get("/parse-fhl/{awb}")
def parse_fhl(awb: str, service: EdiService = Depends(get_weighing_header_service)) -> FhlResponse:
    return service.parse_fhl(awb)
