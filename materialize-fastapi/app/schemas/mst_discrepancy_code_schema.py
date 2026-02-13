from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SeverityType = Literal["INFO", "MINOR", "MAJOR", "CRITICAL"]


class MstDiscrepancyCodeBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    category: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    severity: SeverityType = "MAJOR"
    hold_delivery: bool = False
    require_photo: bool = False
    require_remark: bool = True
    is_active: bool = True


class MstDiscrepancyCodeCreate(MstDiscrepancyCodeBase):
    pass


class MstDiscrepancyCodeUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=20)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    severity: SeverityType | None = None
    hold_delivery: bool | None = None
    require_photo: bool | None = None
    require_remark: bool | None = None
    is_active: bool | None = None


class MstDiscrepancyCodeOut(MstDiscrepancyCodeBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
