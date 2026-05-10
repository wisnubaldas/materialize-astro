from datetime import date, datetime

from pydantic import BaseModel


class ExpManifestFlightOut(BaseModel):
    id: int
    number_build_up: str | None = None
    airlines_code: str | None = None
    origin: str | None = None
    dest: str | None = None
    flight_date: date | None = None
    for_official_use: str | None = None
    total_pieces: int | None = None
    total_weight: float | None = None
    total_volume: float | None = None
    pdf_link: str | None = None
    create_at: datetime | None = None
    update_at: datetime | None = None

    model_config = {"from_attributes": True}
