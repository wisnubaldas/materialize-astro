from typing import Any

from pydantic import BaseModel


class FhlRequestBody(BaseModel):
    fhl: str
    email: str
    data: Any
