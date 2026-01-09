from pydantic import BaseModel

from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut


class ExpManifestFlightDetailRow(BaseModel):
    uld_type: str | None = None
    uld_number: str | None = None
    uld_owner: str | None = None
    destination: str | None = None
    remarks: str | None = None
    mawb_prefix: str | None = None
    mawb_number: str | None = None
    pieces: int | None = None
    weight_kg: float | None = None
    nature_of_goods: str | None = None
    route: str | None = None
    transit_flag: bool | None = None

    model_config = {"from_attributes": True}


class ExpManifestFlightDetailResponse(BaseModel):
    flight: ExpManifestFlightOut
    details: list[ExpManifestFlightDetailRow]
