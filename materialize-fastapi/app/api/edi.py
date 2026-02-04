import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from app.dependencies.discrepancy_code_deps import get_discrepancy_code_service
from app.dependencies.edi_deps import (
    get_buildup_mawb_service,
    get_buildup_service,
    get_fwb_service_r,
    get_fwb_service_w,
    get_manifest_mawb_service,
    get_masterwaybill_service,
    get_weighing_header_service,
)
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.exp_manifest_mawb_schema import ExpManifestMawbOut
from app.schemas.fhl_request_body import FhlRequestBody
from app.schemas.fhl_schema import FhlResponse
from app.schemas.fwb_email_request_body import FwbEmailRequestBody
from app.schemas.fwb_schema import FwbResponse
from app.schemas.fwb_table_schema import FwbTableOut
from app.schemas.imp_hostawb import ImpHostAWBOut
from app.schemas.mst_discrepancy_code_schema import MstDiscrepancyCodeOut
from app.schemas.responseSchema import ResponseSchema
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.discrepancy_code_service import DiscrepancyCodeService
from app.services.edi_service import EdiService

router = APIRouter(prefix="/edi", tags=["Send Electronic data interchange (EDI)"])
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
    summary="data tables awb and mawb export",
    response_model=DataTablesResponse[EksMasterWaybillOut],
)
def export_awb_mawb(
    params: DataTablesParams, service: EdiService = Depends(get_masterwaybill_service)
):
    return service.masterwaybill_datatables(params)


@router.post(
    "/manifest-mawb",
    summary="MAWB manifest data grid table",
    response_model=DataTablesResponse[ExpManifestMawbOut],
)
def manifest_mawb_datatables(
    params: DataTablesParams, service: EdiService = Depends(get_manifest_mawb_service)
):
    """Datatable for exp_manifest_mawb using DB1 repository."""
    return service.manifest_mawb_datatables(params)


############### bikin format data IATA ######################
@router.get("/parse-fhl/{awb}")
def parse_fhl(awb: str, service: EdiService = Depends(get_weighing_header_service)) -> FhlResponse:
    return service.parse_fhl(awb)


@router.get("/parse-fwb/{awb}")
def parse_fwb(awb: str, service: EdiService = Depends(get_weighing_header_service)) -> FwbResponse:
    return service.parse_fwb(awb)


@router.get(
    "/fwb/{mawb}",
    summary="Retrieve saved FWB data by MAWB",
    response_model=FwbTableOut,
)
def get_fwb_by_mawb(mawb: str, service: EdiService = Depends(get_fwb_service_r)):
    """Expose persisted FWB data from DB1 for a given MAWB."""
    record = service.get_saved_fwb(mawb)
    if record is None:
        raise HTTPException(status_code=404, detail="FWB data tidak ditemukan")
    return record


@router.get(
    "/parse-awb-mawb/{mawb}",
    summary="join MAWB with AWB and customer details",
    response_model=AwbMawbResponse,
)
def parse_awb_mawb(mawb: str, service: EdiService = Depends(get_masterwaybill_service)):
    result = service.parse_awb_mawb(mawb)
    if result is None:
        raise HTTPException(status_code=404, detail="Master AWB tidak ditemukan")
    return result


@router.get(
    "/export-buildup-mawb/{buildup_number}",
    summary="Retrieve relationship Buildup data into `export_mawb` for FFM system",
)
def export_buildup_mawb(
    buildup_number: str, service: EdiService = Depends(get_buildup_mawb_service)
):
    try:
        return service.fetch_data_buildup_mawb(buildup_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/send-email-edi",
    summary="Send an Electronic Data Interchange email",
    response_model=ResponseSchema,
)
async def send_email_edi(params: FhlRequestBody, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        EdiService.send_email_edi, email=params.email, message=params.message, edi=params.edi
    )
    return {
        "status": 200,
        "message": "EDI email is being sent",
        "data": None,
    }


@router.post(
    "/send-email-fwb",
    summary="Send FWB EDI email",
    response_model=ResponseSchema,
)
async def send_email_fwb(
    params: FwbEmailRequestBody,
    background_tasks: BackgroundTasks,
    service: EdiService = Depends(get_fwb_service_w),
):
    """Send FWB email and persist the payload for audit/debug."""
    if not params.emails:
        raise HTTPException(status_code=400, detail="Email tujuan wajib diisi")

    logger.info("FWB parsing payload received: %s", params.data)
    payload = params.data if isinstance(params.data, dict) else {}
    try:
        service.save_fwb_from_payload(payload, params.message)
    except Exception:
        logger.exception("Failed to save FWB data")
        raise HTTPException(status_code=500, detail="Gagal menyimpan data FWB")

    for email in params.emails:
        background_tasks.add_task(
            EdiService.send_email_edi, email=email, message=params.message, edi=params.edi
        )

    return {
        "status": 200,
        "message": "FWB email is being sent",
        "data": None,
    }


@router.get(
    "/discrepancy-codes",
    summary="List all discrepancy codes",
    response_model=list[MstDiscrepancyCodeOut],
)
def list_discrepancy_codes(
    service: DiscrepancyCodeService = Depends(get_discrepancy_code_service),
):
    return service.list_all()


@router.get(
    "/import-masterwaybill/{mawb}",
    summary="data import host awb by MasterAWB",
    response_model=list[ImpHostAWBOut],
)
def get_imp_masterwaybill(
    mawb: str, service: EdiService = Depends(get_masterwaybill_service)
):
    result = service.get_imp_hostawb(mawb)
    if not result:
        raise HTTPException(status_code=404, detail="Master AWB tidak ditemukan")
    return result


@router.get(
    "/import-hostawb/{mawb}",
    summary="data import host awb by MasterAWB",
    response_model=list[ImpHostAWBOut],
)
def get_imp_hostawb(mawb: str, service: EdiService = Depends(get_masterwaybill_service)):
    result = service.get_imp_hostawb(mawb)
    if not result:
        raise HTTPException(status_code=404, detail="Master AWB tidak ditemukan")
    return result


# EDI Status Codes:
# FSU
# - TFD (Transferred)
# - DIS (Discrepancy)
# - NFD (Notified)
# - DLV (Delivered)


# | Code    | Arti                  |
# | ------- | --------------------- |
# | **RCS** | Received from Shipper |
# | **DEP** | Departed              |
# | **ARR** | Arrived               |
# | **RCF** | Received from Flight  |
# | **TFD** | Transferred           |
# | **DIS** | Discrepancy           |
# | **NFD** | Notified              |
# | **DLV** | Delivered             |
# | **AWD** | Awaiting Delivery     |
# | **CCD** | Customs Cleared       |
