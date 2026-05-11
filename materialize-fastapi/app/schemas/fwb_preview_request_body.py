from typing import Any

from pydantic import BaseModel


class FwbPreviewRequestBody(BaseModel):
    """Request body for generating FWB preview from payload without persistence."""

    data: Any | None = None
