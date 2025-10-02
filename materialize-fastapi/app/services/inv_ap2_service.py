import asyncio
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.ap2_fail_inv import AP2FAILINV
from app.models.inv_ap2 import InvAp2
from app.models.respons_inv_ap2 import ResponsInvAp2
from app.models.void_inv_ap2 import VoidInvAp2
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.schemas.ap2_send_inv_schema import AP2SendInv
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceCreate, InvoiceGet
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.void_invoice_schema import (
    VoidInvoiceSchemaBase,
    VoidInvoiceSchemaRequest,
    VoidInvoiceSchemaResponse,
)
from app.services.datatables_service import DataTablesService
from app.services.query.mapping_column import INVTOAP2INV, INVTOAP2INV_BASE
from app.utils.env import ENV
from app.utils.helper import HELPER

logger = logging.getLogger(__name__)
# instance service untuk model InvAp2
inv_ap2_datatable_service = DataTablesService(
    model=InvAp2,
    schema=InvoiceGet,
    search_columns=["NO_INVOICE", "TANGGAL", "JENIS_KARGO", "FLIGHT_NUMBER"],
    custom_filters=[
        "NO_INVOICE",
        "TANGGAL",
        "JENIS_KARGO",
        "FLIGHT_NUMBER",
        "TANGGAL_AWAL",
        "TANGGAL_AKHIR",
    ],
)
inv_ap2_response_inv = DataTablesService(
    model=ResponsInvAp2,
    schema=ResponsInvAp2Get,
    search_columns=[
        "inv",
        "response",
        "status",
    ],
    custom_filters=["inv", "response", "status"],
)

fail_inv_ap2 = DataTablesService(
    model=AP2FAILINV,
    schema=FailInvGet,
    search_columns=[
        "inv",
        "desc",
        "status",
    ],
    custom_filters=["inv", "desc", "status"],
)

void_invoice = DataTablesService(
    model=VoidInvAp2,
    schema=VoidInvoiceSchemaResponse,
    search_columns=["NO_INVOICE", "TANGGAL", "HAWB", "SMU"],
    custom_filters=["NO_INVOICE", "TANGGAL", "HAWB", "SMU"],
)
HEADERS = {
    "Cookie": "dtCookie=CD78B9A24184B932B72CB79ED316B71D|X2RlZmF1bHR8MQ; cookiesession1=678B28B551C74227D505AC9459A5396E"
}


## method protected
def get_dynamic_params(interval_minutes: int = 30):
    now = datetime.datetime.now()
    hari = now.strftime("%Y-%m-%d")
    start_from = now.strftime("%H:%M:%S")
    end_from = (now + timedelta(minutes=interval_minutes)).strftime("%H:%M:%S")
    return {"hari": hari, "start_from": start_from, "end_from": end_from}


class INVAp2Service:
    @staticmethod
    def datatable(db: Session, params: DataTablesParams) -> DataTablesResponse[InvoiceGet]:
        return inv_ap2_datatable_service.get_datatable(db=db, params=params)

    @staticmethod
    def get_data_inv():
        db1 = SessionDB1W()
        db2 = SessionDB2R()
        try:
            params = get_dynamic_params(30)

            query = HELPER.load_sql_query("app/services/query/generate_inv_ekspor.sql")
            sql = text(query)
            invoices = db2.execute(sql, params).mappings().all()
            data_inv = []
            for row in invoices:
                mapped_row = {}
                for k, v in row.items():
                    field_name = INVTOAP2INV.get(k, k)
                    if field_name in InvoiceCreate.model_fields.keys():
                        if isinstance(v, (Decimal, float, int)):
                            mapped_row[field_name] = HELPER.to_string_rounded(v, digits=0)
                        else:
                            mapped_row[field_name] = v  # default bulatkan tanpa desimal
                # Hardcode values (overwrite jika ada di query)
                mapped_row.update(INVTOAP2INV_BASE)  # type: ignore
                invoice_schema = InvoiceCreate(**mapped_row)  # type: ignore
                invoice_model = InvAp2(**invoice_schema.model_dump())
                db1.add(invoice_model)
                data_inv.append(invoice_model)
            db1.commit()
        except Exception as e:
            print("Error sync breakdown:", e)
        finally:
            db1.close()
            db2.close()

    @staticmethod
    def get_response_inv(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[ResponsInvAp2Get]:
        return inv_ap2_response_inv.get_datatable(db=db, params=params)

    @staticmethod
    def get_fail_inv(db: Session, params: DataTablesParams) -> DataTablesResponse[FailInvGet]:
        return fail_inv_ap2.get_datatable(db=db, params=params)

    @staticmethod
    async def send_invoice(date_prefix: str):
        db1 = SessionDB1W()
        results = []
        try:
            sql = text("SELECT * FROM inv_ap2 WHERE TANGGAL LIKE :tgl")
            rows = db1.execute(sql, {"tgl": f"{date_prefix}%"}).fetchall()
            if rows is None:
                raise Exception("Invoice not found")
            async with httpx.AsyncClient() as client:
                for row in rows:
                    # row._mapping untuk akses dict-like
                    row_dict = dict(row._mapping)
                    schema = AP2SendInv(USR=ENV.AP2_DEV_USER, PSW=ENV.AP2_DEV_PASSWORD, **row_dict)
                    # inject USR & PSW hardcode
                    payload = schema.model_dump()
                    logger.info(f"[AP2] Payload dikirim: {payload}")
                    try:
                        resp = await client.post(
                            f"{ENV.AP2_DEV_URL}/api/invo_dtl_v2", headers=HEADERS, data=payload
                        )
                        resp.raise_for_status()
                        results.append(
                            {
                                "invoice": payload.get("NO_INVOICE"),
                                "status": "success",
                                "response": resp.text,
                            }
                        )
                        logger.info(f"[AP2] Results: {results}")
                    except Exception as e:
                        results.append(
                            {
                                "invoice": payload.get("NO_INVOICE"),
                                "status": "error",
                                "error": str(e),
                            }
                        )
                        logger.error(f"[AP2] Error: {e}", exc_info=True)
            db1.commit()
        except Exception as e:
            db1.rollback()
            raise e
        finally:
            db1.close()
        logger.info(f"[AP2] Final Results: {results}")
        return results

    @staticmethod
    def send_invoice_sync(date_prefix: str):
        """Wrapper sync supaya bisa dipanggil Celery task biasa"""
        return asyncio.run(INVAp2Service.send_invoice(date_prefix))

    @staticmethod
    async def void_invoice_ap2(
        request: VoidInvoiceSchemaBase, db: Session
    ) -> VoidInvoiceSchemaResponse:
        async with httpx.AsyncClient() as client:
            ext_request = VoidInvoiceSchemaRequest(
                **request.model_dump(), USR=ENV.AP2_DEV_USER, PSW=ENV.AP2_DEV_PASSWORD
            )

            resp = await client.post(
                f"{ENV.AP2_DEV_URL}/api/void_invo_dtl",
                headers=HEADERS,
                data=ext_request.model_dump(),
            )
            resp.raise_for_status()

            merged = request.model_dump()
            merged["RESPONSE"] = resp.json()
            result = VoidInvoiceSchemaResponse(**merged)

            obj_data = VoidInvAp2(
                TANGGAL=result.TANGGAL,
                NO_INVOICE=result.NO_INVOICE,
                HAWB=result.HAWB,
                SMU=result.SMU,
                RESPONSE=json.dumps(resp.json()),
            )
            db.add(obj_data)
            db.commit()
            db.refresh(obj_data)

            return result

    @staticmethod
    def table_void_invoice(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[VoidInvoiceSchemaResponse]:
        return void_invoice.get_datatable(db=db, params=params)
