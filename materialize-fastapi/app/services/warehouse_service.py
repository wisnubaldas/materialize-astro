import logging

from app.repository.warehouse_repositrory import WarehouseRepository
from app.schemas.build_up_detail_schema import BuildUpDetailOut
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut

logger = logging.getLogger("warehouse")


class WarehouseService:
    def __init__(self, repo: WarehouseRepository):
        self.repository = repo

    def manifest_flight_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[ExpManifestFlightOut]:
        return self.repository.manifest_flight_datatable(params)

    def manifest_flight_details(self, header_id: int) -> list[BuildUpDetailOut]:
        rows = self.repository.get_manifest_flight_details(header_id)
        return [BuildUpDetailOut.model_validate(row) for row in rows]

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def get_masterwaybills_by_awb(
        self, master_awbs: list[str]
    ) -> list[ExportBuildupOut]:
        """Fetch build-up master rows for multiple MasterAWB values."""
        cleaned = [awb.strip() for awb in master_awbs if awb and awb.strip()]
        if not cleaned:
            raise ValueError("MasterAWB wajib diisi.")

        return self.repository.get_masterwaybill_by_awbs(cleaned)
