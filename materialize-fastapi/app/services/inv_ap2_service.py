import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from json import dumps

import httpx
import requests
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
from app.services.redis_service import publish_sync
from app.utils.env import ENV
from app.utils.helper import HELPER
from app.utils.logging_utils import log_execution

CHANNEL_NAME = "send_invoice_ap2_channel"

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
    # gunakan datetime.now() (bukan datetime.datetime.now())
    now = datetime.now()  # noqa: DTZ005
    hari = now.strftime("%Y-%m-%d")
    start_from = now.strftime("%H:%M:%S")
    end_from = (now + timedelta(minutes=interval_minutes)).strftime("%H:%M:%S")
    return {"hari": hari, "start_from": start_from, "end_from": end_from}


class INVAp2Service:
    @staticmethod
    @log_execution(logger_name="angkasapura")
    def datatable(db: Session, params: DataTablesParams) -> DataTablesResponse[InvoiceGet]:
        print("Menampilkan semua data invoice")
        return inv_ap2_datatable_service.get_datatable(db=db, params=params)

    # sync data invoice untuk di send dari mysql2 ke mysql1
    @staticmethod
    @log_execution(logger_name="angkasapura")
    def get_data_inv():  # noqa: PLR0912
        print("sync data invoice untuk di send dari mysql2 ke mysql1")
        publish_sync(
            CHANNEL_NAME,
            dumps(
                {
                    "level": "info",
                    "message": "sync data invoice untuk di send dari mysql2 ke mysql1",
                }
            ),
        )
        db1 = SessionDB1W()
        db2 = SessionDB2R()
        try:
            params = get_dynamic_params(30)

            # Kumpulan query sumber data invoice
            query_files = [
                "app/services/query/generate_inv_ekspor.sql",
                "app/services/query/send_invoice_imp.sql",
                "app/services/query/send_inv_exp_pcp.sql",
            ]

            for qpath in query_files:
                query = HELPER.load_sql_query(qpath)
                sql = text(query)
                rows = db2.execute(sql, params).mappings().all()
                print(f"Loaded {len(rows)} rows from {qpath}")
                for row in rows:
                    mapped_row: dict = {}
                    for k, v in row.items():
                        field_name = INVTOAP2INV.get(k, k)
                        if field_name in InvoiceCreate.model_fields.keys():  # noqa: SIM118
                            if isinstance(v, (Decimal, float, int)):
                                mapped_row[field_name] = HELPER.to_string_rounded(v, digits=0)
                            else:
                                mapped_row[field_name] = v

                    # Hardcode values (overwrite jika ada di query)
                    mapped_row.update(INVTOAP2INV_BASE)  # type: ignore

                    # Validasi dan normalisasi via schema
                    publish_sync(
                        CHANNEL_NAME,
                        dumps(
                            {
                                "level": "info",
                                "message": "Validasi dan normalisasi via schema",
                            }
                        ),
                    )
                    invoice_schema = InvoiceCreate(**mapped_row)  # type: ignore
                    values = invoice_schema.model_dump()

                    # Upsert berdasarkan NO_INVOICE (jika None maka dianggap selalu insert)
                    no_invoice = values.get("NO_INVOICE")
                    publish_sync(
                        CHANNEL_NAME,
                        dumps(
                            {
                                "level": "info",
                                "message": f"Upsert berdasarkan NO_INVOICE = {no_invoice} (jika None maka dianggap selalu insert)",
                            }
                        ),
                    )
                    if no_invoice:
                        existing = (
                            db1.query(InvAp2)
                            .filter(InvAp2.NO_INVOICE == no_invoice)  # noqa: SIM300
                            .first()
                        )
                    else:
                        existing = None

                    if existing is not None:
                        # Update semua kolom dari schema ke model
                        for key, val in values.items():
                            if hasattr(existing, key):
                                setattr(existing, key, val)
                    else:
                        db1.add(InvAp2(**values))

            db1.commit()
        except Exception as e:
            db1.rollback()
            logger.error("Error sync breakdown: %s", e, exc_info=True)
        finally:
            db1.close()
            db2.close()

    @staticmethod
    @log_execution(logger_name="angkasapura")
    def get_response_inv(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[ResponsInvAp2Get]:
        return inv_ap2_response_inv.get_datatable(db=db, params=params)

    @staticmethod
    @log_execution(logger_name="angkasapura")
    def get_fail_inv(db: Session, params: DataTablesParams) -> DataTablesResponse[FailInvGet]:
        return fail_inv_ap2.get_datatable(db=db, params=params)

    # send invoice ke AP2 (sinkron)
    @staticmethod
    @log_execution(logger_name="angkasapura")
    def send_invoice(date_prefix: str):
        db1 = SessionDB1W()
        results = []
        try:
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Mulai kirim invoice prefix: {date_prefix}"}),
            )

            sql = text("SELECT * FROM inv_ap2 WHERE TANGGAL LIKE :tgl AND status = 0")
            rows = db1.execute(sql, {"tgl": f"{date_prefix}%"}).fetchall()
            if not rows:
                msg = "Invoice not found"
                publish_sync(CHANNEL_NAME, dumps({"level": "info", "message": msg}))
                db1.commit()
                return []

            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Ditemukan {len(rows)} invoice untuk dikirim"}),
            )

            with requests.Session() as client:
                for row in rows:
                    row_dict = dict(row._mapping)
                    schema = AP2SendInv(USR=ENV.AP2_DEV_USER, PSW=ENV.AP2_DEV_PASSWORD, **row_dict)
                    payload = schema.model_dump()

                    inv_no = payload.get("NO_INVOICE")
                    publish_sync(
                        CHANNEL_NAME,
                        dumps({"level": "info", "message": f"Kirim invoice: {inv_no}"}),
                    )

                    try:
                        resp = client.post(
                            f"{ENV.AP2_DEV_URL}/api/invo_dtl_v2",
                            headers=HEADERS,
                            data=payload,
                            timeout=60,
                        )

                        response_data = {
                            "affected_rows": 1,
                            "message": resp.text[:255],
                            "status": str(resp.status_code),
                        }

                        db1.add(
                            ResponsInvAp2(
                                inv=str(inv_no) if inv_no is not None else None,
                                response=json.dumps(response_data),
                                status=response_data["status"],
                            )
                        )

                        results.append({"invoice": inv_no, **response_data})
                        publish_sync(
                            CHANNEL_NAME,
                            dumps(
                                {
                                    "level": "info",
                                    "message": f"Berhasil invoice: {inv_no} (HTTP {resp.status_code})",
                                }
                            ),
                        )
                    except Exception as e:
                        response_data = {
                            "affected_rows": 0,
                            "message": f"Info: {e!s}",
                            "status": "500",
                        }
                        db1.add(
                            ResponsInvAp2(
                                inv=str(inv_no) if inv_no is not None else None,
                                response=json.dumps(response_data),
                                status=response_data["status"],
                            )
                        )
                        results.append({"invoice": inv_no, **response_data})
                        publish_sync(
                            CHANNEL_NAME,
                            dumps({"level": "info", "message": f"Info: {e!s}"}),
                        )

            db1.commit()
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Selesai kirim {len(results)} invoice"}),
            )
        except Exception as e:
            db1.rollback()
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Info: {e!s}"}),
            )
            raise
        finally:
            db1.close()
        return results

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
