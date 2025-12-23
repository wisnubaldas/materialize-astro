import logging

from fastapi import APIRouter, Depends

from app.deps.warehouse_deps import get_warehouse_service
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
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
