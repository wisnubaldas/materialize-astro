from pydantic import BaseModel

from app.schemas.eks_hostawb import EksHostAWBOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.mst_customer_schema import CustomerOut


class AwbMawbResponse(BaseModel):
    master: EksMasterWaybillOut
    host_awbs: list[EksHostAWBOut]
    agen: CustomerOut | None = None
    shipper: CustomerOut | None = None
