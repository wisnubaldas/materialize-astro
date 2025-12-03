from pydantic import BaseModel

from app.schemas.weighing_detail_schema import WeighingDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut


class FhlResponse(BaseModel):
    header: WeighingHeaderOut | None
    details: list[WeighingDetailOut]
