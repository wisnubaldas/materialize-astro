from datetime import datetime

from pydantic import BaseModel


class ExpManifestMawbOut(BaseModel):
    id: int
    uld_id: int | None = None
    mawb_number: str | None = None
    pieces: int | None = None
    weight_kg: float | None = None
    nature_of_goods: str | None = None
    route: str | None = None
    transit_flag: bool | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
