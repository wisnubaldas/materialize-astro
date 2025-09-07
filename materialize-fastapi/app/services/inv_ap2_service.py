from sqlalchemy import func
from sqlalchemy.orm import Session
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceGet
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
    
        # query = db.query(InvAp2)
        # # search value
        # search_value = params.search.value
        # if search_value:
        #     query = query.filter(InvAp2.id.like(f'%{search_value}%')) # tambahkan kolom lain jika perlu
        #     query = query.filter(InvAp2.NO_INVOICE.like(f'%{search_value}%'))
        #     query = query.filter(InvAp2.TGL_INVOICE.like(f'%{search_value}%'))
        # total_records = db.query(func.count(InvAp2.id)).scalar() # 
        # filtered_records = query.count()
        # # Ordering
        # for order in params.order:
        #     col_idx = order.column
        #     col_name = params.columns[col_idx].data
        #     direction = order.dir
        #     if hasattr(InvAp2, col_name):
        #         col = getattr(InvAp2, col_name)
        #         query = query.order_by(col.desc() if direction == "desc" else col.asc())
        
        # # Pagination
        # results = query.offset(params.start).limit(params.length).all()
        # dtTables = DataTablesResponse(
        #     draw=params.draw,
        #     recordsTotal=total_records,
        #     recordsFiltered=filtered_records,
        #     data=[InvoiceGet.model_validate(r) for r in results]
        # )
        # # print(dtTables)
        # return dtTables