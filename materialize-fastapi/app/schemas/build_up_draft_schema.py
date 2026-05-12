from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BuildUpDraftBase(BaseModel):
    """Payload draft BuildUp dari frontend."""

    rows: list[dict[str, Any]] = Field(default_factory=list)
    payload: dict[str, Any] | None = None
    ignored: dict[str, Any] = Field(default_factory=dict)
    master_awbs: list[str] = Field(default_factory=list)

    @field_validator("rows")
    @classmethod
    def validate_rows(cls, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not value:
            raise ValueError("rows draft wajib diisi")
        return value

    @field_validator("master_awbs", mode="before")
    @classmethod
    def normalize_master_awbs(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]


class BuildUpDraftCreate(BuildUpDraftBase):
    pass


class BuildUpDraftUpdate(BuildUpDraftBase):
    pass


class BuildUpDraftOut(BuildUpDraftBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    create_at: datetime
    update_at: datetime
