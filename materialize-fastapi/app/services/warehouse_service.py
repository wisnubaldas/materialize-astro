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

    def get_masterwaybills_by_awb(
        self, master_awbs: list[str]
    ) -> list[EksMasterWaybillOut]:
        """Fetch eks_masterwaybill records for multiple MasterAWB values."""
        cleaned = [awb.strip() for awb in master_awbs if awb and awb.strip()]
        if not cleaned:
            raise ValueError("MasterAWB wajib diisi.")

        rows = self.repository.get_masterwaybill_by_awbs(cleaned)
        by_awb = {row.MasterAWB: row for row in rows}
        ordered_unique = list(dict.fromkeys(cleaned))
        return [by_awb[awb] for awb in ordered_unique if awb in by_awb]
