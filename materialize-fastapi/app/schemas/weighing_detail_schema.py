from datetime import datetime

from pydantic import BaseModel


class WeighingDetailBase(BaseModel):
    ProofNumber: str | None = None
    MasterAWB: str
    HostAWB: str | None = None

    Pieces: int | None = None
    Pallet: float | None = None
    GrossWeight: float | None = None
    NettoWeight: float | None = None

    LongCargo: int | None = None
    WidthCargo: int | None = None
    HighCargo: int | None = None
    VolumeCargo: float | None = None

    CAW: float | None = None
    StorageRoom: str | None = None
    DG: str | None = None
    KindOfCode: str | None = None
    KindOfNature: str | None = None

    BuildUpFlag: bool = False
    DateEntry: str | None = None
    TimeEntry: str | None = None
    token: str | None = None


class WeighingDetailCreate(WeighingDetailBase):
    MasterAWB: str


class WeighingDetailUpdate(WeighingDetailBase):
    pass


class WeighingDetailOut(WeighingDetailBase):
    noid: int
    created_at: datetime

    model_config = {"from_attributes": True}
