from datetime import datetime

from pydantic import BaseModel, Field


class EksBuildUpDetailBase(BaseModel):
    BuildUpNumber: str | None = None
    MasterAWB: str | None = None
    Parsial: str | None = Field(None, max_length=1)
    TransitCode: str | None = None
    PartPieces: int | None = None
    Pieces: int | None = None
    PartNetto: float | None = None
    Netto: float | None = None
    Volume: float | None = None
    UldCardNumber: str | None = None
    KindOfGood: str | None = None
    EmployeeNumber: str | None = None
    AgenCode: str | None = None
    condition: str | None = None
    OverLoadCode: str | None = Field(None, max_length=1)
    DONumber: str | None = None
    Remarks: str | None = None
    OfficialUse: str | None = None
    PrintNumber: int | None = 0
    DateEntry: str | None = None
    TimeEntry: str | None = None
    FFM: bool | None = False
    void: bool | None = False
    token: str | None = "71901"


class EksBuildUpDetailCreate(EksBuildUpDetailBase):
    """All fields optional, default values already provided"""

    pass


class EksBuildUpDetailUpdate(EksBuildUpDetailBase):
    """Partial update allowed"""

    pass


class EksBuildUpDetailOut(EksBuildUpDetailBase):
    noid: int
    created_at: datetime

    model_config = {"from_attributes": True}
