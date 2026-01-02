import logging

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.deps.warehouse_deps import get_warehouse_service
from app.db.mysql import get_db1_w
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.services.warehouse_manifest_service import FedexManifestService
from app.services.warehouse_service import WarehouseService

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])
logger = logging.getLogger("warehouse")


@router.post(
    "/awb-data-for-buildup",
    summary="Master AWB data list",
    response_model=DataTablesResponse[EksMasterWaybillOut],
)
def awb_data_for_buildup(
    params: DataTablesParams,
    service: WarehouseService = Depends(get_warehouse_service),
):
    return service.masterwaybill_datatable(params)


@router.post("/upload-fedex-manifest", summary="Upload manifest Fedex via Excel")
def upload_fedex_manifest(file: UploadFile = File(...), db: Session = Depends(get_db1_w)):
    return FedexManifestService.upload_manifest(file=file, db=db)
