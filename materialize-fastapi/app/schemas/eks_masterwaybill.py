from datetime import datetime

from pydantic import BaseModel


class EksMasterWaybillBase(BaseModel):
    Pieces: int | None = None
    Weight: float | None = None
    Volume: float | None = None
    AirlinesCode: str | None = None
    FlightNo: str | None = None
    Origin: str | None = None
    Destination: str | None = None
    DateOfFlight: str | None = None
    KindOfGood: str | None = None
    KindOfCode: str | None = None
    PENnumber: str | None = None
    KTKR: str | None = None
    DateOfPen: str | None = None
    HSCode: str | None = None
    AgenCode: str | None = None
    ShipperCode: str | None = None
    ConsigneeCode: str | None = None
    bc11: str | None = None
    tglbc11: str | None = None
    nopos: str | None = None
    Multihost: str | None = "0"
    Parsial: str | None = "0"
    DateOfOut: str | None = None
    TimeOut: str | None = None
    DateOfIn: str | None = None
    TimeIn: str | None = None
    RCS: int | None = 0
    FWB: int | None = 0
    PDE: int | None = 0
    Status: int | None = 0
    DateEntry: str | None = None
    TimeEntry: str | None = None
    void: int | None = 0
    token: str | None = None


class EksMasterWaybillCreate(EksMasterWaybillBase):
    MasterAWB: str


class EksMasterWaybillUpdate(EksMasterWaybillBase):
    pass


class EksMasterWaybillOut(EksMasterWaybillBase):
    MasterAWB: str
    created_at: datetime

    model_config = {"from_attributes": True}
