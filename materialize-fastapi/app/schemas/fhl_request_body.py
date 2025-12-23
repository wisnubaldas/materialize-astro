from typing import Any

from pydantic import BaseModel


class FhlRequestBody(BaseModel):
    message: str
    email: str
    data: Any
    edi: str
