"""Warehouse API wrapper for operational warehouse requests."""

from __future__ import annotations

from app.api.http_client import HttpClient
from app.schemas.warehouse_schema import ExportBuildupDTO, WarehouseMasterWaybillRequestDTO


class WarehouseApi:
    """HTTP wrapper for warehouse endpoints used by desktop module."""

    def __init__(self, http_client: HttpClient) -> None:
        """Initialize warehouse API wrapper."""
        self._http = http_client

    def get_masterwaybill_bulk(
        self,
        payload: WarehouseMasterWaybillRequestDTO,
    ) -> list[ExportBuildupDTO]:
        """Call `/warehouse/masterwaybill/bulk` for master AWB lookup."""
        raw = self._http.post("/warehouse/masterwaybill/bulk", json_payload=payload.model_dump(by_alias=True))
        return [ExportBuildupDTO.model_validate(item) for item in raw]