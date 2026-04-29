"""Warehouse ViewModel for warehouse page state and search actions."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.warehouse_schema import ExportBuildupDTO
from app.services.warehouse_service import WarehouseService


@dataclass(slots=True)
class WarehouseState:
    """Warehouse page state container."""

    is_loading: bool = False
    error_message: str | None = None
    rows: list[ExportBuildupDTO] = field(default_factory=list)


class WarehouseViewModel:
    """Coordinate warehouse lookup action and state transitions."""

    def __init__(self, warehouse_service: WarehouseService) -> None:
        """Initialize warehouse viewmodel with service dependency."""
        self._warehouse_service = warehouse_service
        self.state = WarehouseState()

    def search_master_awb(self, raw_values: str) -> list[ExportBuildupDTO]:
        """Search master AWB data and update state."""
        self.state.is_loading = True
        self.state.error_message = None
        try:
            values = [item.strip() for item in raw_values.split(",") if item.strip()]
            if not values:
                raise ValueError("Minimal satu MasterAWB harus diisi.")
            rows = self._warehouse_service.find_masterwaybills(values)
            self.state.rows = rows
            return rows
        except Exception as exc:
            self.state.error_message = str(exc)
            raise
        finally:
            self.state.is_loading = False