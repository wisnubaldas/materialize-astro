from typing import Any

from pydantic import BaseModel


class FwbSaveRequestBody(BaseModel):
    """Request body for saving FWB payload without sending email."""

    message: str | None = None
    data: Any | None = None
