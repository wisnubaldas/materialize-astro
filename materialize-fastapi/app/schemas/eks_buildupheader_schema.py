from datetime import datetime

from pydantic import BaseModel


class EksBuildupHeaderBase(BaseModel):
    """Schema dasar untuk header buildup export."""

    buildup_number: str | None = None
    airlines_code: str | None = None
    flight_number: str | None = None
    destination_code: str | None = None
    date_of_flight: str | None = None
    aircraft_registration: str | None = None
    etd: str | None = None
    time_departure: str | None = None
    total_master_awb: int | None = None
    part_of_pieces: int | None = None
    total_pieces: int | None = None
    part_of_netto: float | None = None
    total_netto: float | None = None
    total_volume: float | None = None
    employee_number: str | None = None
    operator_name: str | None = None
    date_entry: str | None = None
    time_entry: str | None = None
    void: bool | None = None
    ffm_message_key: str | None = None
    token: str | None = None

    model_config = {
        "from_attributes": True,
    }


class EksBuildupHeaderCreate(EksBuildupHeaderBase):
    """Schema create (semua field opsional, gunakan default)."""

    pass


class EksBuildupHeaderUpdate(EksBuildupHeaderBase):
    """Schema update partial."""

    pass


class EksBuildupHeaderOut(EksBuildupHeaderBase):
    noid: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }
