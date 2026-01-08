from pydantic import BaseModel

from app.schemas.mst_customer_schema import CustomerOut
from app.schemas.weighing_detail_schema import WeighingDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut


class FwbResponse(BaseModel):
    header: WeighingHeaderOut | None
    details: list[WeighingDetailOut]
    agen: CustomerOut | None = None
