from datetime import datetime

from pydantic import BaseModel


class BuildUpDetailOut(BaseModel):
    id: int
    header_id: int
    mawb: str | None = None
    uld_number: str | None = None
    uld_type: str | None = None
    pieces: int | None = None
    weight: float | None = None
    nature_of_goods: str | None = None
    remark: str | None = None
    create_at: datetime | None = None

    model_config = {"from_attributes": True}
