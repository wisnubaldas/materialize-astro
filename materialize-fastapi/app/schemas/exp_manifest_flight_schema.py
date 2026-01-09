from datetime import date, datetime

from pydantic import BaseModel


class ExpManifestFlightOut(BaseModel):
    id: int
    airline_code: str | None = None
    flight_number: str | None = None
    flight_date: date | None = None
    aircraft_registration: str | None = None
    point_of_loading: str | None = None
    point_of_unloading: str | None = None
    total_pieces: int | None = None
    total_weight_kg: float | None = None
    source_document: str | None = None
    raw_text: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
