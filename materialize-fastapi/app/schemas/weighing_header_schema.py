from datetime import datetime

from pydantic import BaseModel, Field


class WeighingHeaderBase(BaseModel):
    ProofNumber: str = Field(default="")
    MasterAWB: str | None = None
    AirlinesCode: str | None = None
    Origin: str | None = None
    Destination: str | None = None
    FlightNumber: str | None = None
    ShipperCode: str | None = None
    AgenCode: str | None = None
    ConsigneeCode: str | None = None
    AgenPIC: str | None = None

    TotalPieces: int | None = None
    TotalPallet: float | None = None
    TotalNetto: float | None = None
    TotalVolume: float | None = None
    TotalCAW: float | None = None

    DateOfFlight: str | None = None
    DateOfEntry: str | None = None
    TimeOfEntry: str | None = None
    BookingCode: str | None = None
    MultiVolume: str | None = None
    PaymentCode: str | None = None

    Directmaster: bool = False
    EmployeeNumber: str | None = None
    InvoiceNumber: str | None = None
    PrintNumber: bool = False
    report: bool = False
    RCS: bool = False
    FHL: bool = False
    FWB: bool = False
    void: bool = False
    gateIn: bool = False  # noqa: N815
    token: str | None = None


class WeighingHeaderCreate(WeighingHeaderBase):
    ProofNumber: str


class WeighingHeaderUpdate(WeighingHeaderBase):
    pass


class WeighingHeaderOut(WeighingHeaderBase):
    noid: int
    created_at: datetime

    model_config = {"from_attributes": True}
