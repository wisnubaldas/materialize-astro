from datetime import datetime

from pydantic import BaseModel


class MstDiscrepancyCodeOut(BaseModel):
    id: int
    code: str
    category: str
    name: str
    description: str | None = None
    severity: str
    hold_delivery: bool
    require_photo: bool
    require_remark: bool
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
