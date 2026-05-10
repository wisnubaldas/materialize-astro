from datetime import date

from pydantic import BaseModel


class ExportBuildupOut(BaseModel):
    mawb: str
    airlines_code: str | None = None
    flight_number: str | None = None
    origin: str | None = None
    dest: str | None = None
    flight_date: date | None = None
    pieces: int | None = None
    total_pieces: int | None = None
    volume: float | None = None
    total_volume: float | None = None
    weight: float | None = None
    total_weight: float | None = None
    nature_of_goods: str | None = None
