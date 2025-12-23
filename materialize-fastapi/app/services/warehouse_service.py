import logging

from app.repository.warehouse_repositrory import WarehouseRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut

logger = logging.getLogger("warehouse")


class WarehouseService:
    def __init__(self, repo: WarehouseRepository):
        self.repository = repo

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)
