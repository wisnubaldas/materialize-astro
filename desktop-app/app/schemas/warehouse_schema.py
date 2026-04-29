"""Warehouse DTOs for desktop warehouse modules."""

from __future__ import annotations

from pydantic import BaseModel, Field


class WarehouseMasterWaybillRequestDTO(BaseModel):
    """Request payload for warehouse master waybill bulk lookup."""

    master_awb: list[str] = Field(alias="MasterAWB", min_length=1)

    model_config = {"populate_by_name": True}


class ExportBuildupDTO(BaseModel):
    """Minimal export buildup DTO for initial desktop display."""

    MasterAWB: str | None = None
    HAWB: str | None = None
    Dest: str | None = None
    Koli: int | None = None
    Berat: float | None = None