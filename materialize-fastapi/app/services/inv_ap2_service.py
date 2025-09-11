from sqlalchemy import  text
from sqlalchemy.orm import Session
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceGet
from app.models.inv_ap2 import InvAp2
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.models.respons_inv_ap2 import ResponsInvAp2

from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.models.ap2_fail_inv import AP2FAILINV

from app.services.datatables_service import DataTablesService
from app.db.mysql import SessionDB1W, SessionDB2R

# instance service untuk model InvAp2
inv_ap2_datatable_service = DataTablesService(
    model=InvAp2,
    schema=InvoiceGet,
    search_columns=["NO_INVOICE", "TANGGAL","JENIS_KARGO","FLIGHT_NUMBER"],
    custom_filters=["NO_INVOICE", "TANGGAL","JENIS_KARGO","FLIGHT_NUMBER","TANGGAL_AWAL","TANGGAL_AKHIR"],
)
inv_ap2_response_inv = DataTablesService(
    model=ResponsInvAp2,
    schema=ResponsInvAp2Get,
    search_columns=["inv", "response","status",],
    custom_filters=["inv", "response","status"],
)

fail_inv_ap2 = DataTablesService(
    model=AP2FAILINV,
    schema=FailInvGet,
    search_columns=["inv", "desc","status",],
    custom_filters=["inv", "desc","status"],
)
class INVAp2Service:
    @staticmethod
    def datatable(db: Session, params: DataTablesParams)-> DataTablesResponse[InvoiceGet]:
        return inv_ap2_datatable_service.get_datatable(db=db, params=params)
    
    @staticmethod
    def get_data_inv():
        db1 = SessionDB1W()
        db2 = SessionDB2R()
        try:
            sql = text("SELECT * FROM `eks_invoiceheader` WHERE DateOfTransaction = '2024-02-16'")
            invoices = db2.execute(sql).fetchall()
            for inv in invoices:
                print(inv)
            db2.commit()
        except Exception as e:
            print("Error sync breakdown:", e)
        finally:
            db1.close()
            db2.close()

    @staticmethod
    def get_response_inv(db: Session, params: DataTablesParams)-> DataTablesResponse[ResponsInvAp2Get]:
        return inv_ap2_response_inv.get_datatable(db=db, params=params)
    
    @staticmethod
    def get_fail_inv(db: Session, params: DataTablesParams)-> DataTablesResponse[FailInvGet]:
        return fail_inv_ap2.get_datatable(db=db, params=params)
            
# if __name__ == "__main__":
#     INVAp2Service.get_data_inv()