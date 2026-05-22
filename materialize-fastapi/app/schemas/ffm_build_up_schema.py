from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class FfmBuildUpOut(BaseModel):
    """Data header Build Up Check yang dipakai modul EDI FFM."""

    id: int
    number_build_up: str | None = None
    mawb: str | None = None
    airlines_code: str | None = None
    origin: str | None = None
    dest: str | None = None
    flight_date: date | None = None
    uld_type: str | None = None
    uld_number: str | None = None
    uld_owner: str | None = None
    total_pieces: int | None = None
    total_weight: float | None = None
    create_at: datetime | None = None


class FfmBuildUpDetailOut(BaseModel):
    """Detail MAWB/ULD dari Build Up Check untuk preview FFM."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    header_id: int
    mawb: str | None = None
    uld_type: str | None = None
    uld_number: str | None = None
    uld_owner: str | None = None
    pieces: int | None = None
    weight: float | None = None
    volume: float | None = None
    nature_of_goods: str | None = None
    remark: str | None = None
    create_at: datetime | None = None
