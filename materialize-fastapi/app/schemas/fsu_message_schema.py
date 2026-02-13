from pydantic import BaseModel, Field


class FsuMessageBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=10)
    remark: str = Field(..., min_length=1)
    status: bool = True


class FsuMessageCreate(FsuMessageBase):
    pass


class FsuMessageUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=10)
    remark: str | None = Field(default=None, min_length=1)
    status: bool | None = None


class FsuMessageOut(FsuMessageBase):
    id: int

    model_config = {"from_attributes": True}
