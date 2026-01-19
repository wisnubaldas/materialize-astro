from datetime import datetime

from pydantic import BaseModel


class ImpMasterWaybillBase(BaseModel):
    Pieces: float | None = None
    Weight: float | None = None
    Volume: float | None = None
    AirlinesCode: str | None = None
    FlightNo: str | None = None
    Origin: str | None = None
    Destination: str | None = None
    DateOfFight: str | None = None
    KindOfGood: str | None = None
    KindOfCode: str | None = None
    HSCode: str | None = None
    AgenCode: str | None = None
    ShipperCode: str | None = None
    ConsigneeCode: str | None = None
    bc11: str | None = None
    tglbc11: str | None = None
    nopos: str | None = None
    Multihost: str | None = None
    Parsial: str | None = None
    DateOfOut: str | None = None
    TimeOut: str | None = None
    DateOfIn: str | None = None
    TimeIn: str | None = None
    void: int | None = None
    token: str | None = None


class ImpMasterWaybillOut(ImpMasterWaybillBase):
    MasterAWB: str
    created_at: datetime

    model_config = {"from_attributes": True}
