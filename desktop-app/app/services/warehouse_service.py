"""Warehouse use-cases for desktop features."""

from __future__ import annotations

from app.api.warehouse_api import WarehouseApi
from app.schemas.warehouse_schema import ExportBuildupDTO, WarehouseMasterWaybillRequestDTO


class WarehouseService:
    """Coordinate warehouse desktop requests through warehouse API wrapper."""

    def __init__(self, warehouse_api: WarehouseApi) -> None:
        """Initialize warehouse service with API dependency."""
        self._warehouse_api = warehouse_api

    def find_masterwaybills(self, master_awb_values: list[str]) -> list[ExportBuildupDTO]:
        """Lookup master waybill list via backend warehouse endpoint."""
        payload = WarehouseMasterWaybillRequestDTO(MasterAWB=master_awb_values)
        return self._warehouse_api.get_masterwaybill_bulk(payload)