from sqlalchemy import func
from sqlalchemy.orm import Session
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceGet, InvoiceCreate
from app.models.inv_ap2 import InvAp2
from app.services.datatables_service import DataTablesService

# instance service untuk model InvAp2
inv_ap2_datatable_service = DataTablesService(
    model=InvAp2,
    schema=InvoiceGet,
    search_columns=["id", "NO_INVOICE", "TGL_INVOICE"]
)

class INVAp2Service:
    @staticmethod
    def datatable(db: Session, params: DataTablesParams)-> DataTablesResponse[InvoiceGet]:
        return inv_ap2_datatable_service.get_datatable(db=db, params=params)
    