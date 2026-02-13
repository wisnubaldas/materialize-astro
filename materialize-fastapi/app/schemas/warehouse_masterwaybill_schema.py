from pydantic import BaseModel, Field


class WarehouseMasterWaybillRequest(BaseModel):
    """Payload request for bulk MasterAWB lookup."""

    MasterAWB: list[str] = Field(default_factory=list, description="Daftar Master AWB.")
