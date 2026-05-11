from pydantic import BaseModel, Field


class ApiErrorItem(BaseModel):
    field: str | None = None
    code: str | None = None
    message: str


class ApiErrorResponse(BaseModel):
    status: str = "error"
    message: str
    errors: list[ApiErrorItem] = Field(default_factory=list)
