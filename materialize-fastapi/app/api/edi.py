import logging

from fastapi import APIRouter, Depends, HTTPException

from app.deps.edi_deps import (
    get_buildup_mawb_service,
    get_buildup_service,
    get_masterwaybill_service,
    get_weighing_header_service,
)
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.fhl_request_body import FhlRequestBody
from app.schemas.fhl_schema import FhlResponse
from app.schemas.responseSchema import ResponseSchema
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.edi_service import EdiService

router = APIRouter(prefix="/edi", tags=["Kirim Electronic data interchange"])
logger = logging.getLogger("edi")


@router.post(
    "/export-buildup",
    summary="grid data buildup export",
    response_model=DataTablesResponse[EksBuildupHeaderOut],
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


@router.post(
    "/export-awb-mawb",
    summary="data tables awb dan mawb",
    response_model=DataTablesResponse[EksMasterWaybillOut],
)
def export_awb_mawb(
    params: DataTablesParams, service: EdiService = Depends(get_masterwaybill_service)
):
    return service.masterwaybill_datatables(params)


############### bikin format data IATA ######################
@router.get("/parse-fhl/{awb}")
def parse_fhl(awb: str, service: EdiService = Depends(get_weighing_header_service)) -> FhlResponse:
    return service.parse_fhl(awb)


@router.get(
    "/parse-awb-mawb/{mawb}",
    summary="join MAWB dengan detail AWB dan customer",
    response_model=AwbMawbResponse,
)
def parse_awb_mawb(mawb: str, service: EdiService = Depends(get_masterwaybill_service)):
    result = service.parse_awb_mawb(mawb)
    if result is None:
        raise HTTPException(status_code=404, detail="Master AWB tidak ditemukan")
    return result


@router.get(
    "/export-buildup-mawb/{buildup_number}",
    summary="Ambil data buildup relasi ke export_mawb untuk FFM",
)
def export_buildup_mawb(
    buildup_number: str, service: EdiService = Depends(get_buildup_mawb_service)
):
    try:
        return service.fetch_data_buildup_mawb(buildup_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/send-email-fhl",
    summary="Kirim email fhl",
    response_model=ResponseSchema,
)
async def send_email_fhl(params: FhlRequestBody):
    try:
        await EdiService.send_email_fhl(email=params.email, fhl=params.fhl)
        return {
            "status": 200,
            "message": "Email FHL berhasil dikirim",
            # Kembalikan objek tunggal DI SINI
            "data": None,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
