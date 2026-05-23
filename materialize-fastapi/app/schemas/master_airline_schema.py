from datetime import datetime
from typing import Literal, Any

from pydantic import BaseModel, Field


class MasterAirlineBase(BaseModel):
    """
    Base Pydantic model for Master Airline.
    """
    iata_code: str | None = Field(default=None, max_length=5)
    icao_code: str | None = Field(default=None, max_length=5)
    airline_name: str = Field(..., min_length=1, max_length=100)
    short_name: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=100)
    awb_prefix: str | None = Field(default=None, max_length=10)
    home_base: str | None = Field(default=None, max_length=10)
    cargo_handling_agent: str | None = Field(default=None, max_length=100)
    sitatex_address: str | None = Field(default=None, max_length=50)
    edi_support: Any = Field(default=None)
    special_handling_codes: Any = Field(default=None)
    allowed_uld_types: Any = Field(default=None)
    contact_person: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=100)
    contact_phone: str | None = Field(default=None, max_length=50)
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"


class MasterAirlineCreate(MasterAirlineBase):
    """
    Schema for creating a Master Airline.
    """
    pass


class MasterAirlineUpdate(BaseModel):
    """
    Schema for updating a Master Airline. All fields are optional.
    """
    iata_code: str | None = Field(default=None, max_length=5)
    icao_code: str | None = Field(default=None, max_length=5)
    airline_name: str | None = Field(default=None, min_length=1, max_length=100)
    short_name: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=100)
    awb_prefix: str | None = Field(default=None, max_length=10)
    home_base: str | None = Field(default=None, max_length=10)
    cargo_handling_agent: str | None = Field(default=None, max_length=100)
    sitatex_address: str | None = Field(default=None, max_length=50)
    edi_support: Any = Field(default=None)
    special_handling_codes: Any = Field(default=None)
    allowed_uld_types: Any = Field(default=None)
    contact_person: str | None = Field(default=None, max_length=100)
    contact_email: str | None = Field(default=None, max_length=100)
    contact_phone: str | None = Field(default=None, max_length=50)
    status: Literal["ACTIVE", "INACTIVE"] | None = None


class MasterAirlineOut(MasterAirlineBase):
    """
    Schema for output representation of a Master Airline.
    """
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
