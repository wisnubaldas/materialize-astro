from pydantic import BaseModel


class ErrorResponse(BaseModel):
    message: str


class UnauthorizedResponse(ErrorResponse):
    status: int = 401
