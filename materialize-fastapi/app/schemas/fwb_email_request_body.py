from typing import Any

from pydantic import BaseModel, EmailStr


class FwbEmailRequestBody(BaseModel):
    emails: list[EmailStr]
    message: str
    data: Any | None = None
    edi: str
