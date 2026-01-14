# linting: pylint: disable=too-many-lines, duplicate-code, too-many-statements, too-many-locals
# pylint: disable=too-many-branches, too-many-nested-blocks, too-many-arguments, unused-argument
import calendar
import logging
import re
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from json import dumps
from pathlib import Path

import httpx
import pandas as pd
import requests
from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from xhtml2pdf import pisa

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.BaseDB1.ap2_fail_inv import AP2FAILINV
from app.models.BaseDB1.inv_ap2 import InvAp2
from app.models.BaseDB1.respons_inv_ap2 import ResponsInvAp2
from app.models.BaseDB1.void_inv_ap2 import VoidInvAp2
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.schemas.ap2_send_inv_schema import AP2SendInv
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import (
    InvoiceCreate,
    InvoiceDailySummary,
    InvoiceGet,
    InvoiceMonthlySummary,
)
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.void_invoice_schema import (
    VoidInvoiceSchemaBase,
    VoidInvoiceSchemaRequest,
    VoidInvoiceSchemaResponse,
)
from app.services.datatables_service import DataTablesService
from app.repository.query.mapping_column import INVTOAP2INV, INVTOAP2INV_BASE
from app.services.redis_service import publish_sync
from app.utils.env import ENV
from app.utils.helper import HELPER
from app.utils.logging_utils import task_name

CHANNEL_NAME = "send_invoice_ap2_channel"
MONTH_PATTERN = re.compile(r"^\d{4}-\d{2}$")
MONTH_NAMES = {index: name for index, name in enumerate(calendar.month_name) if index}

logger = logging.getLogger(__name__)
# instance service untuk model InvAp2
inv_ap2_datatable_service = DataTablesService(
    model=InvAp2,
    schema=InvoiceGet,
    search_columns=["NO_INVOICE", "TANGGAL", "JENIS_KARGO", "FLIGHT_NUMBER", "KDAIRLINE", "SMU"],
    custom_filters=[
        "NO_INVOICE",
        "TANGGAL",
        "JENIS_KARGO",
        "FLIGHT_NUMBER",
        "TANGGAL_AWAL",
        "TANGGAL_AKHIR",
        "KDAIRLINE",
        "SMU",
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
    search_columns=["NO_INVOICE", "TANGGAL", "HAWB", "SMU", "KDAIRLINE"],
    custom_filters=["NO_INVOICE", "TANGGAL", "HAWB", "SMU", "KDAIRLINE"],
)
HEADERS = {
    "Cookie": "dtCookie=CD78B9A24184B932B72CB79ED316B71D|X2RlZmF1bHR8MQ; cookiesession1=678B28B551C74227D505AC9459A5396E"
}


# Helper utilities
def get_dynamic_params() -> dict[str, str]:
    """Return dynamic parameters required by invoice sync queries."""
    now = datetime.now()  # noqa: DTZ005
    return {"hari": now.strftime("%Y-%m-%d")}


class INVAp2Service:
    @staticmethod
    def get_invoice_excel_perbulan(db: Session, bulan: str) -> bytes:
        logger.info(
            "Generating invoice Excel for month: %s",
            bulan,
            extra={"event": "invoice.excel.generate", "month": bulan},
        )
        results = (
            db.query(InvAp2)
            .filter(InvAp2.TANGGAL.like(f"{bulan}%"))
            .order_by(InvAp2.TANGGAL.asc(), InvAp2.NO_INVOICE.asc())
            .all()
        )

        if not results:
            logger.info(
                "tidak ada data Excel for month: %s",
                bulan,
                extra={"event": "invoice.excel.generate", "month": bulan},
            )
            raise HTTPException(
                status_code=400, detail="Tidak ada data untuk di buat laporan Excel"
            )
        else:
            _df = pd.DataFrame(
                [
                    {
                        "Invoice Number": inv.NO_INVOICE,
                        "Customer": inv.TANGGAL,
                        "Total": float(
                            inv.TOTAL_PENDAPATAN_DENGAN_PPN
                        ),  # Decimal -> float supaya Excel ngerti
                        "Tanggal": inv.TANGGAL,
                    }
                    for inv in results
                ]
            )

        # tulis dataframe ke Excel (worksheet "Invoices")
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            _df.to_excel(writer, index=False, sheet_name="Invoices")
            # optional formatting contoh: autosize kolom
            ws = writer.sheets["Invoices"]
            for col in ws.columns:
                max_length = 0
                col_letter = col[0].column_letter
                for cell in col:
                    val = "" if cell.value is None else str(cell.value)
                    if len(val) > max_length:
                        max_length = len(val)
                ws.column_dimensions[col_letter].width = max_length + 2
        # penting: pindahkan cursor ke awal dan kembalikan bytes
        return output.getvalue()

    @staticmethod
    def get_invoice_pdf_perbulan(db: Session, bulan: str) -> bytes:  # noqa: PLR0915
        if not MONTH_PATTERN.match(bulan):
            logger.warning(
                "Format bulan tidak valid: %s",
                bulan,
                extra={"event": "invoice.pdf.invalid_month", "month": bulan},
            )
            raise HTTPException(
                status_code=400, detail="Format bulan tidak valid. Gunakan YYYY-MM."
            )

        logger.info(
            "Generating invoice PDF for month: %s",
            bulan,
            extra={"event": "invoice.pdf.generate", "month": bulan},
        )
        month_prefix = bulan

        results = (
            db.query(InvAp2)
            .filter(InvAp2.TANGGAL.like(f"{month_prefix}%"))
            .order_by(InvAp2.TANGGAL.asc(), InvAp2.NO_INVOICE.asc())
            .all()
        )

        if not results:
            logger.warning(
                "Tidak ada data invoice untuk bulan: %s",
                month_prefix,
                extra={"event": "invoice.pdf.empty", "month": month_prefix},
            )
            raise HTTPException(
                status_code=404, detail="Data invoice tidak ditemukan untuk bulan tersebut."
            )

        # Lokasi folder templates
        templates_dir = Path(__file__).resolve().parent.parent / "templates"

        def to_decimal(raw_value: str | int | Decimal | None) -> Decimal:
            if raw_value in (None, ""):
                return Decimal("0")
            if isinstance(raw_value, Decimal):
                return raw_value
            try:
                return Decimal(str(raw_value).replace(",", "").strip())
            except (ValueError, ArithmeticError) as exc:
                logger.debug("Gagal konversi nilai ke Decimal: %s - %s", raw_value, exc)
                return Decimal("0")

        total_tanpa_ppn = sum(to_decimal(row.TOTAL_PENDAPATAN_TANPA_PPN) for row in results)
        total_dengan_ppn = sum(to_decimal(row.TOTAL_PENDAPATAN_DENGAN_PPN) for row in results)
        totals = {
            "tanpa_ppn": total_tanpa_ppn,
            "dengan_ppn": total_dengan_ppn,
            "tanpa_ppn_display": format(total_tanpa_ppn, ",.2f"),
            "dengan_ppn_display": format(total_dengan_ppn, ",.2f"),
        }

        invoices = []
        for row in results:
            item = InvoiceGet.model_validate(row).model_dump()
            tanpa_ppn_value = to_decimal(row.TOTAL_PENDAPATAN_TANPA_PPN)
            dengan_ppn_value = to_decimal(row.TOTAL_PENDAPATAN_DENGAN_PPN)
            item["TOTAL_PENDAPATAN_TANPA_PPN_VALUE"] = tanpa_ppn_value
            item["TOTAL_PENDAPATAN_DENGAN_PPN_VALUE"] = dengan_ppn_value
            item["TOTAL_PENDAPATAN_TANPA_PPN_DISPLAY"] = format(tanpa_ppn_value, ",.2f")
            item["TOTAL_PENDAPATAN_DENGAN_PPN_DISPLAY"] = format(dengan_ppn_value, ",.2f")
            invoices.append(item)

        env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

        month_label = month_prefix
        try:
            year_str, month_str = month_prefix.split("-", maxsplit=1)
            month_index = int(month_str)
            if 1 <= month_index <= 12:
                month_label = f"{MONTH_NAMES.get(month_index, month_prefix)} {year_str}"
        except (ValueError, AttributeError):
            month_label = month_prefix

        try:
            template = env.get_template("invoice.html")
            html_content = template.render(
                invoices=invoices,
                month=month_prefix,
                month_label=month_label,
                generated_at=datetime.now(),  # noqa: DTZ005
                total_records=len(invoices),
                totals=totals,
            )
            pdf_buffer = BytesIO()
            pdf_result = pisa.CreatePDF(
                src=html_content,
                dest=pdf_buffer,
                encoding="utf-8",
                link_callback=None,
            )
        except Exception as exc:
            logger.exception(
                "Gagal menghasilkan PDF invoice untuk bulan: %s",
                month_prefix,
                extra={"event": "invoice.pdf.failure", "month": month_prefix},
            )
            raise HTTPException(status_code=500, detail="Gagal membuat PDF invoice.") from exc

        if pdf_result.err:
            logger.error(
                "xhtml2pdf gagal menghasilkan output PDF untuk bulan: %s",
                month_prefix,
                extra={"event": "invoice.pdf.xhtml2pdf_error", "month": month_prefix},
            )
            raise HTTPException(status_code=500, detail="Gagal memproses file PDF.")

        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.getvalue()
        if not pdf_bytes:
            logger.error(
                "xhtml2pdf tidak menghasilkan output PDF untuk bulan: %s",
                month_prefix,
                extra={"event": "invoice.pdf.empty_output", "month": month_prefix},
            )
            raise HTTPException(status_code=500, detail="File PDF kosong.")

        logger.info(
            "Berhasil menghasilkan PDF invoice untuk bulan: %s",
            month_prefix,
            extra={"event": "invoice.pdf.success", "month": month_prefix, "rows": len(invoices)},
        )
        return pdf_bytes

    @staticmethod
    def _normalized_invoice_date():
        return func.coalesce(
            func.str_to_date(InvAp2.TANGGAL, "%Y-%m-%d"),
            func.str_to_date(InvAp2.TANGGAL, "%Y-%m-%d %H:%i:%s"),
            func.str_to_date(InvAp2.TANGGAL, "%d-%m-%Y"),
            func.str_to_date(InvAp2.TANGGAL, "%d/%m/%Y"),
            func.str_to_date(InvAp2.TANGGAL, "%Y/%m/%d"),
            InvAp2.created_at,
        )

    @staticmethod
    def invoice_perbulan(db: Session, tahun: int):
        normalized_date = INVAp2Service._normalized_invoice_date()

        rows = (
            db.query(
                func.year(normalized_date).label("year"),
                func.month(normalized_date).label("month"),
                func.count(InvAp2.id).label("total_sent"),
            )
            .filter(
                InvAp2.status == 1,
                func.year(normalized_date) == tahun,
            )
            .group_by(func.year(normalized_date), func.month(normalized_date))
            .order_by(func.year(normalized_date), func.month(normalized_date))
            .all()
        )

        return [
            InvoiceMonthlySummary(
                year=row.year,
                month=row.month,
                total_sent=row.total_sent,
            )
            for row in rows
            if row.year is not None and row.month is not None
        ]

    @staticmethod
    def invoice_perbulan_detail(db: Session, tahun: int, bulan: int):
        normalized_date = INVAp2Service._normalized_invoice_date()

        rows = (
            db.query(
                func.year(normalized_date).label("year"),
                func.month(normalized_date).label("month"),
                func.day(normalized_date).label("day"),
                func.count(InvAp2.id).label("total_sent"),
            )
            .filter(
                InvAp2.status == 1,
                func.year(normalized_date) == tahun,
                func.month(normalized_date) == bulan,
            )
            .group_by(
                func.year(normalized_date),
                func.month(normalized_date),
                func.day(normalized_date),
            )
            .order_by(
                func.year(normalized_date),
                func.month(normalized_date),
                func.day(normalized_date),
            )
            .all()
        )

        return [
            InvoiceDailySummary(
                year=row.year,
                month=row.month,
                day=row.day,
                total_sent=row.total_sent,
            )
            for row in rows
            if row.year is not None and row.month is not None and row.day is not None
        ]

    @staticmethod
    def search_invoice_response(db: Session, invoice_number: str):
        logger.info("Searching for invoice responses with invoice number: %s", invoice_number)
        try:
            responses = (
                db.query(ResponsInvAp2)
                .filter(ResponsInvAp2.inv == invoice_number)
                .order_by(ResponsInvAp2.created_at.desc())
                .all()
            )

            if not responses:
                logger.info("No invoice response found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Invoice number '{invoice_number}' not found.",
                )

            logger.info("Found %d response entries", len(responses))
            return [ResponsInvAp2Get.from_orm(item) for item in responses]
        except Exception as e:
            logger.error("Error searching for invoice response: %s", e, exc_info=True)
            raise

    @staticmethod
    def datatable(db: Session, params: DataTablesParams) -> DataTablesResponse[InvoiceGet]:
        with task_name("Datatables"):
            logger.info("Menampilkan semua data invoice")
            return inv_ap2_datatable_service.get_datatable(db=db, params=params)

    # sync data invoice untuk di send dari mysql2 ke mysql1
    @staticmethod
    def get_data_inv():  # noqa: PLR0912, PLR0915
        logger.info("Sync data invoice untuk di send dari mysql2 ke mysql1")
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
            params = get_dynamic_params()
            logger.info("Parameter query: %s", params)

            # Kumpulan query sumber data invoice
            query_files = [
                "app/repository/query/generate_inv_ekspor.sql",
                "app/repository/query/send_invoice_imp.sql",
                "app/repository/query/send_inv_exp_pcp.sql",
            ]

            pending_records: list[dict] = []

            for qpath in query_files:
                query = HELPER.load_sql_query(qpath)
                sql = text(query)
                rows = db2.execute(sql, params).mappings().all()
                logger.info("Loaded %d rows from %s", len(rows), qpath)
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
                    invoice_schema = InvoiceCreate(**mapped_row)  # type: ignore
                    values = invoice_schema.model_dump()

                    pending_records.append(values)

            if not pending_records:
                logger.info("Tidak ada data invoice yang ditemukan untuk sinkronisasi")
                return

            unique_invoices = {
                str(inv_no)
                for inv_no in (item.get("NO_INVOICE") for item in pending_records)
                if inv_no is not None
            }
            existing_numbers: set[str] = set()
            if unique_invoices:
                existing_numbers = {
                    str(existing_no)
                    for (existing_no,) in db1.query(InvAp2.NO_INVOICE)
                    .filter(InvAp2.NO_INVOICE.in_(unique_invoices))
                    .all()
                }

            records_to_insert: list[dict] = []
            seen_numbers = set(existing_numbers)
            skipped = 0

            for values in pending_records:
                no_invoice_raw = values.get("NO_INVOICE")
                normalized_no_invoice = str(no_invoice_raw) if no_invoice_raw is not None else None

                if normalized_no_invoice:
                    if normalized_no_invoice in seen_numbers:
                        skipped += 1
                        continue
                    seen_numbers.add(normalized_no_invoice)
                    values["NO_INVOICE"] = normalized_no_invoice
                else:
                    logger.warning("NO_INVOICE tidak tersedia, jalankan insert baru")

                records_to_insert.append(values)

            if not records_to_insert:
                logger.info("Semua invoice sudah ada, tidak ada data baru untuk ditambahkan")
                publish_sync(
                    CHANNEL_NAME,
                    dumps(
                        {
                            "level": "info",
                            "message": "Semua invoice sudah ada, tidak ada data baru untuk ditambahkan",
                        }
                    ),
                )
                return

            db1.bulk_insert_mappings(InvAp2, records_to_insert)  # type: ignore

            logger.info(
                "Berhasil menambahkan %d invoice baru ke inv_ap2 (lewati %d duplikat)",
                len(records_to_insert),
                skipped,
            )
            publish_sync(
                CHANNEL_NAME,
                dumps(
                    {
                        "level": "info",
                        "message": f"Berhasil menambahkan {len(records_to_insert)} invoice baru ke inv_ap2 (lewati {skipped} duplikat)",
                    }
                ),
            )

            db1.commit()
        except Exception as e:
            db1.rollback()
            logger.error("Error sync breakdown: %s", e, exc_info=True)
        finally:
            db1.close()
            db2.close()

    # send invoice ke AP2 (sinkron)
    @staticmethod
    def send_invoice():
        logger.info("Mulai proses kirim invoice ke AP2", extra={"event": "invoice.send.start"})
        db1 = SessionDB1W()
        results = []
        try:
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": "Mulai kirim invoice"}),
            )

            sql = text("SELECT * FROM inv_ap2 WHERE status = 0 LIMIT 10")
            rows = db1.execute(sql).fetchall()
            if not rows:
                msg = "Invoice not found"
                logger.info(
                    "Tidak ada invoice baru yang siap dikirim",
                    extra={"event": "invoice.send.empty"},
                )
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
                    schema = AP2SendInv(USR=ENV.AP2_USER, PSW=ENV.AP2_PASSWORD, **row_dict)
                    payload = schema.model_dump()

                    inv_no = payload.get("NO_INVOICE")
                    publish_sync(
                        CHANNEL_NAME,
                        dumps({"level": "info", "message": f"Kirim invoice: {inv_no}"}),
                    )

                    success = False
                    try:
                        resp = client.post(
                            f"{ENV.AP2_URL}/api/invo_dtl_v2",
                            headers=HEADERS,
                            data=payload,
                            timeout=60,
                        )

                        success = resp.status_code == 200
                        response_data = {
                            "affected_rows": 1 if success else 0,
                            "message": resp.text[:255],
                            "status": str(resp.status_code),
                        }
                    except Exception as e:
                        response_data = {
                            "affected_rows": 0,
                            "message": f"Info: {e!s}",
                            "status": "500",
                        }
                        publish_sync(
                            CHANNEL_NAME,
                            dumps({"level": "info", "message": f"Info: {e!s}"}),
                        )
                    finally:
                        if inv_no:
                            db1.execute(
                                text("UPDATE inv_ap2 SET status = :status WHERE NO_INVOICE = :inv"),
                                {"status": 1 if success else 2, "inv": str(inv_no)},
                            )

                    db1.add(
                        ResponsInvAp2(
                            inv=str(inv_no) if inv_no is not None else None,
                            response=dumps(response_data),
                            status=response_data["status"],
                        )
                    )

                    results.append({"invoice": inv_no, **response_data})

                    if success:
                        publish_sync(
                            CHANNEL_NAME,
                            dumps(
                                {
                                    "level": "info",
                                    "message": f"Berhasil invoice: {inv_no} (HTTP {response_data['status']})",
                                }
                            ),
                        )
                    else:
                        publish_sync(
                            CHANNEL_NAME,
                            dumps(
                                {
                                    "level": "info",
                                    "message": f"Gagal invoice: {inv_no} (HTTP {response_data['status']})",
                                }
                            ),
                        )

            db1.commit()
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Selesai kirim {len(results)} invoice"}),
            )
            logger.info(
                "Selesai kirim %d invoice ke AP2",
                len(results),
                extra={"event": "invoice.send.complete", "count": len(results)},
            )
        except Exception as e:
            db1.rollback()
            logger.exception(
                "Gagal mengirim invoice ke AP2",
                extra={"event": "invoice.send.error"},
            )
            publish_sync(
                CHANNEL_NAME,
                dumps({"level": "info", "message": f"Info: {e!s}"}),
            )
            raise
        finally:
            db1.close()
        return results

    @staticmethod
    def get_response_inv(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[ResponsInvAp2Get]:
        logger.info(
            "Memuat data response invoice AP2",
            extra={"event": "datatable.fetch", "datatable": "respons_inv_ap2"},
        )
        return inv_ap2_response_inv.get_datatable(db=db, params=params)

    @staticmethod
    def get_fail_inv(db: Session, params: DataTablesParams) -> DataTablesResponse[FailInvGet]:
        logger.info(
            "Memuat data invoice gagal AP2",
            extra={"event": "datatable.fetch", "datatable": "fail_inv_ap2"},
        )
        return fail_inv_ap2.get_datatable(db=db, params=params)

    @staticmethod
    async def void_invoice_ap2(
        request: VoidInvoiceSchemaBase, db: Session
    ) -> VoidInvoiceSchemaResponse:
        ext_request = VoidInvoiceSchemaRequest(
            **request.model_dump(), USR=ENV.AP2_DEV_USER, PSW=ENV.AP2_DEV_PASSWORD
        )

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{ENV.AP2_DEV_URL}/api/void_invo_dtl",
                    headers=HEADERS,
                    data=ext_request.model_dump(),
                )
                resp.raise_for_status()
        except httpx.TimeoutException as exc:
            logger.error(
                "Timeout saat menghubungi AP2 untuk void invoice %s",
                request.NO_INVOICE,
                exc_info=exc,
                extra={"event": "invoice.void.timeout", "invoice": request.NO_INVOICE},
            )
            raise HTTPException(status_code=504, detail="AP2 tidak merespons.") from exc
        except httpx.HTTPStatusError as exc:
            logger.error(
                "AP2 mengembalikan status %s saat void invoice %s",
                exc.response.status_code,
                request.NO_INVOICE,
                exc_info=exc,
                extra={
                    "event": "invoice.void.http_error",
                    "invoice": request.NO_INVOICE,
                    "status": exc.response.status_code,
                },
            )
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text) from exc
        except httpx.RequestError as exc:
            logger.error(
                "Gagal menghubungi AP2 untuk void invoice %s",
                request.NO_INVOICE,
                exc_info=exc,
                extra={"event": "invoice.void.connection_error", "invoice": request.NO_INVOICE},
            )
            raise HTTPException(status_code=502, detail="Gagal menghubungi layanan AP2.") from exc

        resp_json = resp.json()
        merged = request.model_dump()
        merged["RESPONSE"] = resp_json
        result = VoidInvoiceSchemaResponse(**merged)

        try:
            obj_data = VoidInvAp2(
                TANGGAL=result.TANGGAL,
                NO_INVOICE=result.NO_INVOICE,
                HAWB=result.HAWB,
                SMU=result.SMU,
                RESPONSE=dumps(resp_json),
            )
            db.add(obj_data)
            db.commit()
            db.refresh(obj_data)
        except Exception as exc:  # pragma: no cover - defensive
            db.rollback()
            logger.exception(
                "Gagal menyimpan data void invoice AP2 untuk %s",
                result.NO_INVOICE,
                extra={"event": "invoice.void.persist_error", "invoice": result.NO_INVOICE},
            )
            raise HTTPException(status_code=500, detail="Gagal menyimpan respons void invoice AP2.") from exc

        return result

    @staticmethod
    def table_void_invoice(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[VoidInvoiceSchemaResponse]:
        return void_invoice.get_datatable(db=db, params=params)
