from datetime import date  # noqa: N999

from pydantic import BaseModel, ConfigDict, Field


class HouseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hawb: str = Field(..., description="House AWB number")
    pieces: int = Field(..., ge=0, description="Number of pieces")
    weight: float = Field(..., ge=0, description="Weight of the house shipment")
    destination: str | None = Field(None, description="Destination airport code")


class FFMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    flight_no: str = Field(..., description="Flight number (e.g., QR957)")
    flight_date: date = Field(..., description="Flight date (YYYY-MM-DD)")
    origin: str = Field(..., description="Origin airport code")
    destination: str = Field(..., description="Destination airport code")
    via: str | None = Field(None, description="Via routing airport code")

    total_pieces: int = Field(..., ge=0, description="Total pieces")
    total_weight: float = Field(..., ge=0, description="Total weight")
    weight_unit: str = Field(
        ..., description="Weight unit", json_schema_extra={"examples": ["K", "L"]}
    )

    house_list: list[HouseItem] = Field(
        default_factory=list, description="List of house AWB details"
    )

    raw_message: str = Field(..., description="Raw FFM SITATEX message")
