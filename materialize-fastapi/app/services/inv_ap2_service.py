from unittest import result
import httpx
from sqlalchemy import  text
from sqlalchemy.orm import Session
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceGet
from app.models.inv_ap2 import InvAp2
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.models.respons_inv_ap2 import ResponsInvAp2
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.models.ap2_fail_inv import AP2FAILINV
from app.schemas.ap2_send_inv_schema import AP2SendInv

from app.services.datatables_service import DataTablesService

from app.db.mysql import SessionDB1W, SessionDB2R

from app.utils.env import ENV

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
HEADERS = {
    "Cookie": "dtCookie=CD78B9A24184B932B72CB79ED316B71D|X2RlZmF1bHR8MQ; cookiesession1=678B28B551C74227D505AC9459A5396E"
}

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
    
    @staticmethod
    async def send_invoice(date_prefix: str):
        db1 = SessionDB1W()
        results = []
        try:
            sql = text(f"SELECT * FROM inv_ap2 WHERE TANGGAL LIKE :tgl")
            rows = db1.execute(sql, {"tgl": f"{date_prefix}%"}).fetchall()
            if rows is None:
                raise Exception("Invoice not found")

            async with httpx.AsyncClient() as client:
                for row in rows:
                    # row._mapping untuk akses dict-like
                    row_dict = dict(row._mapping)
                    schema = AP2SendInv(
                        USR= ENV.AP2_DEV_USER,
                        PSW= ENV.AP2_DEV_PASSWORD,
                        **row_dict
                        )
                     # inject USR & PSW hardcode
                    payload = schema.model_dump()
                    # print(payload)
                    
                    try:
                        resp = await client.post(ENV.AP2_DEV_URL, headers=HEADERS, data=payload)
                        resp.raise_for_status()
                        results.append({"invoice": payload.get("NO_INVOICE"), "status": "success", "response": resp.text})
                    except Exception as e:
                        results.append({"invoice": payload.get("NO_INVOICE"), "status": "error", "error": str(e)})
            db1.commit()
        except Exception as e:
            db1.rollback()
            raise e
        finally:
            db1.close()

        return results
        
# if __name__ == "__main__":
#     result = await INVAp2Service.send_invoice("2024-02-16")
#     print(result)