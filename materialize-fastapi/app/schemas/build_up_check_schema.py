from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BuildUpCheckHeaderCreate(BaseModel):
    """Payload header checklist build up dari mobile."""

    uld: str = Field(min_length=1, max_length=100)
    airlines: str | None = Field(default=None, max_length=50)
    flight_no: str | None = Field(default=None, max_length=50)
    dest: str | None = Field(default=None, max_length=50)
    flight_date: date | None = None
    staff: str | None = Field(default=None, max_length=100)
    supervisor: str | None = Field(default=None, max_length=100)

    @field_validator("uld", "airlines", "flight_no", "dest", "staff", "supervisor", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> str | None:
        """Normalize empty strings from mobile forms to null."""
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned.upper() if cleaned else None


class BuildUpCheckHeaderOut(BaseModel):
    """Header checklist build up beserta status progress pieces."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    uld: str
    airlines: str | None = None
    flight_no: str | None = None
    dest: str | None = None
    flight_date: date | None = None
    staff: str | None = None
    supervisor: str | None = None
    total_pieces: int = 0
    completed_pieces: int = 0
    is_completed: bool = False
    created_at: datetime
    updated_at: datetime


class BuildUpCheckDetailCreate(BaseModel):
    """Payload detail MAWB dalam satu header build up check."""

    mawb: str = Field(min_length=1, max_length=100)
    total_pieces: int = Field(gt=0)
    agent: str | None = Field(default=None, max_length=100)
    remark: str | None = None

    @field_validator("mawb", "agent", "remark", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned.upper() if cleaned else None


class BuildUpCheckRincianCreate(BaseModel):
    """Payload rincian pieces dan berat untuk satu detail checklist."""

    pieces: int = Field(gt=0)
    weight: float | None = Field(default=None, ge=0)


class BuildUpCheckRincianOut(BaseModel):
    """Rincian input pieces dan berat."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    check_detail_id: int
    pieces: int | None = None
    weight: float | None = None
    created_at: datetime
    updated_at: datetime


class BuildUpCheckDetailOut(BaseModel):
    """Detail checklist beserta akumulasi rincian."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    header_id: int
    mawb: str | None = None
    total_pieces: int | None = None
    status: int = 0
    agent: str | None = None
    remark: str | None = None
    completed_pieces: int = 0
    remaining_pieces: int = 0
    is_completed: bool = False
    rincian: list[BuildUpCheckRincianOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
