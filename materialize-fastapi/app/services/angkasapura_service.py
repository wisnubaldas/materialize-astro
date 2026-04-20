# linting: pylint: disable=too-many-lines, duplicate-code, too-many-statements, too-many-locals
# pylint: disable=too-many-branches, too-many-nested-blocks, too-many-arguments, unused-argument
import calendar
import logging
import re
from copy import deepcopy
from datetime import datetime
from decimal import Decimal
from functools import lru_cache
from io import BytesIO
from json import dumps
from pathlib import Path
from threading import Lock, Thread
from time import sleep
from typing import Any, Callable  # noqa: UP035
from uuid import uuid4

import httpx
import pandas as pd
import requests
from fastapi import HTTPException, UploadFile
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import case, func, text
from sqlalchemy.orm import Session
from xhtml2pdf import pisa

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.BaseDB1.ap2_fail_inv import AP2FAILINV
from app.models.BaseDB1.inv_ap2 import InvAp2
from app.models.BaseDB1.invoice_daily_counter import InvoiceDailyCounter
from app.models.BaseDB1.respons_inv_ap2 import ResponsInvAp2
from app.repository.query.inv_ap2_mapping import INVTOAP2INV, INVTOAP2INV_BASE
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.schemas.ap2_send_inv_schema import AP2SendInv
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import (
    InvoiceCreate,
    InvoiceDailySummary,
    InvoiceGet,
    InvoiceMonthlySummary,
    InvoiceStatusSummary,
)
from app.schemas.invoice_daily_counter_schema import (
    InvoiceDailyCounterGet,
    InvoiceDailyCounterMonthlySummary,
)
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.void_invoice_schema import (
    VoidInvoiceSchemaBase,
    VoidInvoiceSchemaRequest,
    VoidInvoiceSchemaResponse,
)
from app.services.datatables_service import DataTablesService
from app.services.redis_service import publish_sync
from app.utils.env import ENV
from app.utils.helper import HELPER

CHANNEL_NAME = "send_invoice_ap2_channel"
DEBUG_SOURCE_UPLOAD_EXCEL = "upload_excel_invoice"
DEBUG_SOURCE_SCHEDULER_SYNC = "scheduler_get_data_inv"
DEBUG_SOURCE_SCHEDULER_SEND = "scheduler_send_invoice"
MONTH_PATTERN = re.compile(r"^\d{4}-\d{2}$")
MONTH_NAMES = {index: name for index, name in enumerate(calendar.month_name) if index}

logger = logging.getLogger(__name__)
# instance service untuk model InvAp2
inv_ap2_datatable_service = DataTablesService(
    model=InvAp2,
    schema=InvoiceGet,
    search_columns=[
        "NO_INVOICE",
        "TANGGAL",
        "JENIS_KARGO",
        "FLIGHT_NUMBER",
        "KDAIRLINE",
        "SMU",
        "void",
    ],
    custom_filters=[
        "NO_INVOICE",
        "TANGGAL",
        "JENIS_KARGO",
        "FLIGHT_NUMBER",
        "TANGGAL_AWAL",
        "TANGGAL_AKHIR",
        "KDAIRLINE",
        "SMU",
        "void",
    ],
)
inv_ap2_response_inv = DataTablesService(
    model=ResponsInvAp2,
    schema=ResponsInvAp2Get,
    search_columns=[
        "inv",
        "status",
        "created_at",
        "response",
    ],
    custom_filters=["inv", "status", "created_at"],
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

invoice_daily_counter_datatable = DataTablesService(
    model=InvoiceDailyCounter,
    schema=InvoiceDailyCounterGet,
    search_columns=[
        "tanggal",
        "jumlah_invoice",
        "total_koli",
        "total_berat",
        "total_volume",
        "total_pendapatan_tanpa_ppn",
        "total_pendapatan_dengan_ppn",
    ],
    custom_filters=["tanggal"],
)
AP2_COOKIE_VALUE = str(ENV.AP2_COOKIE or "").strip().strip("'").strip('"')
HEADERS = {"Cookie": AP2_COOKIE_VALUE} if AP2_COOKIE_VALUE else {}
AP2_DEV_COOKIE_VALUE = str(ENV.AP2_DEV_COOKIE or "").strip().strip("'").strip('"')
AP2_DEV_VOID_HEADERS = {"Cookie": AP2_DEV_COOKIE_VALUE} if AP2_DEV_COOKIE_VALUE else HEADERS
AP2_VOID_TIMEOUT_SECONDS = max(1, int(ENV.AP2_VOID_TIMEOUT))
AP2_VOID_HTTPX_TIMEOUT = httpx.Timeout(
    timeout=AP2_VOID_TIMEOUT_SECONDS,
    connect=min(5, AP2_VOID_TIMEOUT_SECONDS),
    read=AP2_VOID_TIMEOUT_SECONDS,
    write=min(5, AP2_VOID_TIMEOUT_SECONDS),
    pool=min(5, AP2_VOID_TIMEOUT_SECONDS),
)
UPLOAD_ALLOWED_EXTENSIONS = (".xlsx", ".xlsm", ".xls")
QUERY_FILES_FOR_INVOICE_LOOKUP = [
    "app/repository/query/get_inv_export.sql",
    "app/repository/query/get_inv_import.sql",
    "app/repository/query/get_inv_outgoing.sql",
]
INV_FIELD_TO_EXCEL_HEADERS: dict[str, list[str]] = {
    "NO_INVOICE": ["INVOICE NO"],
    "TANGGAL": ["DATE OF TRANSACTION"],
    "SMU": ["M-AWB"],
    "HAWB": ["HOST MAWB", "M-AWB"],
    "KDAIRLINE": ["AIRLINES"],
    "FLIGHT_NUMBER": ["FLIGHT NO"],
    "DOM_INT": ["INVOICE GATE"],
    "INC_OUT": ["TYPE DATA"],
    "ASAL": ["ORIGIN"],
    "TUJUAN": ["DESTINATION"],
    "JENIS_KARGO": ["NATURE OF GOOD"],
    "TARIF_KARGO": ["PRICE"],
    "KOLI": ["PIECES"],
    "BERAT": ["CAW"],
    "VOLUME": ["BERAT"],
    "JML_HARI": ["OVERSTAY"],
    "CARGO_CHG": ["WAREHOUSE FEE"],
    "TOTAL_PENDAPATAN_TANPA_PPN": ["WAREHOUSE FEE"],
    "TOTAL_PENDAPATAN_DENGAN_PPN": ["WAREHOUSE FEE"],
}
INT_FIELDS = {
    "PJT_HANDLING_FEE",
    "RUSH_HANDLING_FEE",
    "RUSH_SERVICE_FEE",
    "TRANSHIPMENT_FEE",
    "ADMINISTRATION_FEE",
    "DOCUMENTS_FEE",
    "PECAH_PU_FEE",
    "COOL_COLD_STORAGE_FEE",
    "STRONG_ROOM_FEE",
    "AC_ROOM_FEE",
    "DG_ROOM_FEE",
    "AVI_ROOM_FEE",
    "DANGEROUS_GOOD_CHECK_FEE",
    "DISCOUNT_FEE",
    "RKSP_FEE",
    "HAWB_FEE",
    "HAWB_MAWB_FEE",
    "CSC_FEE",
    "ENVIROTAINER_ELEC_FEE",
    "ADDITIONAL_COSTS",
    "NAWB_FEE",
    "BARCODE_FEE",
    "CARGO_DEVELOPMENT_FEE",
    "DUTIABLE_SHIPMENT_FEE",
    "FHL_FEE",
    "FWB_FEE",
    "CARGO_INSPECTION_REPORT_FEE",
    "MATERAI_FEE",
    "PPN_FEE",
    "status",
}
HARI_PARAM_PATTERN = re.compile(r":hari\b", flags=re.IGNORECASE)
SQL_DATE_FILTER_PATTERN = re.compile(
    r"(?P<prefix>\b\w+\.)DateOfTransaction\s*=\s*:invoice_number\b",
    flags=re.IGNORECASE,
)
INVOICE_FILTER_PATTERN = re.compile(
    r"\b\w+\.InvoiceNumber\s*=\s*:invoice_number\b",
    flags=re.IGNORECASE,
)
INVOICE_COLUMN_REF_PATTERN = re.compile(r"(?P<prefix>\b\w+\.)InvoiceNumber\b", flags=re.IGNORECASE)
DATE_COLUMN_REF_PATTERN = re.compile(r"(?P<prefix>\b\w+\.)DateOfTransaction\b", flags=re.IGNORECASE)
REQUIRED_HEADER_KEYS = {"INVOICE NO", "DATE OF TRANSACTION", "M-AWB", "AIRLINES", "FLIGHT NO"}
REQUIRED_HEADER_DISPLAY = "Invoice No, Date Of Transaction, M-AWB, Airlines, Flight No"
UPLOAD_INVOICE_AP2_CHANNEL = "upload_invoice_ap2_channel"
UPLOAD_JOB_ACTIVE_STATUSES = {"waiting_scheduler", "queued", "processing"}
_UPLOAD_JOB_STATE_LOCK = Lock()
_UPLOAD_JOB_STATE: dict[str, Any] = {
    "job_id": None,
    "filename": None,
    "source": DEBUG_SOURCE_UPLOAD_EXCEL,
    "status": "idle",
    "progress": 0,
    "message": "Belum ada proses upload invoice excel.",
    "started_at": None,
    "finished_at": None,
    "updated_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
    "result": None,
    "error": None,
    "scheduler_runs": [],
    "can_upload": True,
}
SCHEDULER_RUN_STATE_LOCK = Lock()
SCHEDULER_ACTIVE_RUNS: dict[str, str] = {}
DB2_INV_SYNC_ENABLED = True


def build_debug_message(source: str, message: str, run_id: str | None = None) -> str:
    if run_id:
        return f"[{source}][{run_id}] {message}"
    return f"[{source}] {message}"


DOM_INC_OUT_SQL = text(
    """
    SELECT
        CASE
            WHEN EXISTS (
                SELECT 1 FROM eks_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM imp_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM imp_invoicepecahpos WHERE InvoiceNumber = :invoice_number LIMIT 1
            ) THEN 'I'
            WHEN EXISTS (
                SELECT 1 FROM inc_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM out_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            ) THEN 'D'
            ELSE NULL
        END AS DOM_INT,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM eks_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM out_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            ) THEN 'O'
            WHEN EXISTS (
                SELECT 1 FROM imp_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM imp_invoicepecahpos WHERE InvoiceNumber = :invoice_number LIMIT 1
            )
            OR EXISTS (
                SELECT 1 FROM inc_invoiceheader WHERE InvoiceNumber = :invoice_number LIMIT 1
            ) THEN 'I'
            ELSE NULL
        END AS INC_OUT
    """
)


# Helper utilities
def get_dynamic_params() -> dict[str, str]:
    """Return dynamic parameters required by invoice sync queries."""
    now = datetime.now()  # noqa: DTZ005
    return {"hari": now.strftime("%Y-%m-%d")}


def normalize_excel_header(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).upper()


def is_empty_value(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    try:
        return bool(pd.isna(value))
    except Exception:
        return False


def normalize_value(value: Any) -> Any:  # noqa: PLR0911
    if is_empty_value(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(value)
    if isinstance(value, Decimal):
        return HELPER.to_string_rounded(value, digits=0)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, str):
        return value.strip()
    return value


def sanitize_number_for_int(value: Any) -> Any:  # noqa: PLR0911
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        compact = value.strip().replace(",", "")
        if compact == "":
            return None
        try:
            return int(float(compact))
        except ValueError:
            return value
    return value


def normalize_void_timestamp(raw_value: str) -> str:
    value = str(raw_value or "").strip()
    if not value:
        return datetime.now().strftime("%Y-%m-%d")  # noqa: DTZ005

    formats = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
    )
    for fmt in formats:
        try:
            parsed = datetime.strptime(value, fmt)  # noqa: DTZ007
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue

    iso_date_match = re.match(r"^(\d{4}-\d{2}-\d{2})", value)
    if iso_date_match:
        return iso_date_match.group(1)

    return value


def is_ap2_void_success(http_status: int, payload: dict[str, Any]) -> bool:
    if not (200 <= http_status < 300):
        return False

    raw_status = payload.get("status")
    if raw_status is None:
        return True

    status_str = str(raw_status).strip()
    if not status_str:
        return True

    return status_str.startswith("2")


def read_excel_upload_payload(filename: str, payload: bytes) -> pd.DataFrame:
    normalized_filename = (filename or "").lower()
    if not normalized_filename.endswith(UPLOAD_ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Format file tidak valid, gunakan Excel (.xlsx / .xlsm / .xls).",
        )

    if not payload:
        raise HTTPException(status_code=400, detail="File Excel kosong.")

    try:
        if normalized_filename.endswith(".xls"):
            raw_df = pd.read_excel(BytesIO(payload), dtype=object, header=None)
        else:
            raw_df = pd.read_excel(BytesIO(payload), dtype=object, header=None, engine="openpyxl")
    except ImportError as exc:
        raise HTTPException(
            status_code=400,
            detail="Gagal membaca file .xls. Pastikan dependency parser excel legacy sudah tersedia.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file Excel: {exc}") from exc

    header_row_index = None
    for idx, raw_row in raw_df.iterrows():
        normalized_headers = {
            normalize_excel_header(value) for value in raw_row.tolist() if not is_empty_value(value)
        }
        if REQUIRED_HEADER_KEYS.issubset(normalized_headers):
            header_row_index = int(idx)
            break

    if header_row_index is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Format template Excel tidak sesuai. "
                f"Kolom wajib tidak ditemukan: {REQUIRED_HEADER_DISPLAY}."
            ),
        )

    header_values = raw_df.iloc[header_row_index].tolist()
    columns: list[str] = []
    used_columns: set[str] = set()
    for col_index, value in enumerate(header_values):
        base_name = str(value).strip() if not is_empty_value(value) else f"UNNAMED_{col_index}"
        column_name = base_name
        sequence = 1
        while column_name in used_columns:
            sequence += 1
            column_name = f"{base_name}_{sequence}"
        used_columns.add(column_name)
        columns.append(column_name)

    data_df = raw_df.iloc[header_row_index + 1 :].copy()
    data_df.columns = columns
    data_df = data_df.dropna(how="all").reset_index(drop=True)
    return data_df


def read_excel_upload(file: UploadFile) -> pd.DataFrame:
    payload = file.file.read()
    return read_excel_upload_payload(filename=file.filename or "", payload=payload)


def get_missing_required_invoice_fields(values: dict[str, Any]) -> list[str]:
    missing_fields: list[str] = []
    for field_name, model_field in InvoiceCreate.model_fields.items():
        if not model_field.is_required():
            continue
        if is_empty_value(values.get(field_name)):
            missing_fields.append(field_name)
    return missing_fields


class INVAp2Service:
    @staticmethod
    def _register_scheduler_run(*, source: str, run_id: str) -> None:
        with SCHEDULER_RUN_STATE_LOCK:
            SCHEDULER_ACTIVE_RUNS[run_id] = source

    @staticmethod
    def _unregister_scheduler_run(*, run_id: str) -> None:
        with SCHEDULER_RUN_STATE_LOCK:
            SCHEDULER_ACTIVE_RUNS.pop(run_id, None)

    @staticmethod
    def _list_active_scheduler_runs() -> list[dict[str, str]]:
        with SCHEDULER_RUN_STATE_LOCK:
            return [
                {"run_id": active_run_id, "source": active_source}
                for active_run_id, active_source in SCHEDULER_ACTIVE_RUNS.items()
            ]

    @staticmethod
    def _is_scheduler_job_active() -> bool:
        with SCHEDULER_RUN_STATE_LOCK:
            return bool(SCHEDULER_ACTIVE_RUNS)

    @staticmethod
    def _is_upload_job_active() -> bool:
        with _UPLOAD_JOB_STATE_LOCK:
            current_status = str(_UPLOAD_JOB_STATE.get("status") or "idle")
            return current_status in UPLOAD_JOB_ACTIVE_STATUSES

    @staticmethod
    def _publish_scheduler_event(
        *,
        source: str,
        run_id: str,
        message: str,
        level: str = "info",
        **extra: Any,
    ) -> None:
        payload: dict[str, Any] = {
            "level": level,
            "source": source,
            "run_id": run_id,
            "message": build_debug_message(source, message, run_id),
        }
        payload.update(extra)
        publish_sync(CHANNEL_NAME, dumps(payload))

    @staticmethod
    def _snapshot_upload_job_state() -> dict[str, Any]:
        with _UPLOAD_JOB_STATE_LOCK:
            snapshot = deepcopy(_UPLOAD_JOB_STATE)

        status_value = str(snapshot.get("status") or "idle")
        if status_value not in UPLOAD_JOB_ACTIVE_STATUSES:
            active_scheduler_runs = INVAp2Service._list_active_scheduler_runs()
            snapshot["scheduler_runs"] = active_scheduler_runs
            if active_scheduler_runs:
                snapshot["can_upload"] = False
                snapshot["message"] = (
                    "Scheduler invoice sedang berjalan. Upload akan antre otomatis."
                )

        return snapshot

    @staticmethod
    def _publish_upload_job_state(state: dict[str, Any]) -> None:
        state_payload = dict(state)
        state_payload.setdefault("source", DEBUG_SOURCE_UPLOAD_EXCEL)
        publish_sync(UPLOAD_INVOICE_AP2_CHANNEL, dumps(state_payload))

    @staticmethod
    def _update_upload_job_state(
        *,
        patch: dict[str, Any],
        job_id: str | None = None,
        force: bool = False,
    ) -> dict[str, Any]:
        with _UPLOAD_JOB_STATE_LOCK:
            current_job_id = _UPLOAD_JOB_STATE.get("job_id")
            if job_id and current_job_id and current_job_id != job_id and not force:
                return deepcopy(_UPLOAD_JOB_STATE)

            _UPLOAD_JOB_STATE.update(patch)
            _UPLOAD_JOB_STATE["source"] = DEBUG_SOURCE_UPLOAD_EXCEL
            _UPLOAD_JOB_STATE["updated_at"] = datetime.now().isoformat(timespec="seconds")  # noqa: DTZ005
            status_value = str(_UPLOAD_JOB_STATE.get("status") or "idle")
            _UPLOAD_JOB_STATE["can_upload"] = status_value not in UPLOAD_JOB_ACTIVE_STATUSES
            snapshot = deepcopy(_UPLOAD_JOB_STATE)

        INVAp2Service._publish_upload_job_state(snapshot)
        return snapshot

    @staticmethod
    def get_upload_invoice_excel_job_status() -> dict[str, Any]:
        return INVAp2Service._snapshot_upload_job_state()

    @staticmethod
    def start_upload_invoice_excel_job(file: UploadFile) -> dict[str, Any]:
        filename = file.filename or ""
        normalized_filename = filename.lower()
        if not normalized_filename.endswith(UPLOAD_ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=400,
                detail="Format file tidak valid, gunakan Excel (.xlsx / .xlsm / .xls).",
            )

        payload = file.file.read()
        if not payload:
            raise HTTPException(status_code=400, detail="File Excel kosong.")

        # Validasi format template lebih awal agar pengguna mendapat feedback 4xx langsung,
        # bukan menunggu status job gagal di background.
        read_excel_upload_payload(filename=filename, payload=payload)
        active_scheduler_runs = INVAp2Service._list_active_scheduler_runs()
        scheduler_is_active = bool(active_scheduler_runs)

        with _UPLOAD_JOB_STATE_LOCK:
            current_status = str(_UPLOAD_JOB_STATE.get("status") or "idle")
            if current_status in UPLOAD_JOB_ACTIVE_STATUSES:
                running_snapshot = deepcopy(_UPLOAD_JOB_STATE)
            else:
                job_id = uuid4().hex
                initial_status = "waiting_scheduler" if scheduler_is_active else "queued"
                initial_message = (
                    "Scheduler invoice sedang berjalan. Upload menunggu hingga scheduler selesai."
                    if scheduler_is_active
                    else "File diterima. Job upload dimulai."
                )
                _UPLOAD_JOB_STATE.update(
                    {
                        "job_id": job_id,
                        "filename": filename,
                        "source": DEBUG_SOURCE_UPLOAD_EXCEL,
                        "status": initial_status,
                        "progress": 0,
                        "message": initial_message,
                        "started_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
                        "finished_at": None,
                        "result": None,
                        "error": None,
                        "scheduler_runs": active_scheduler_runs,
                        "updated_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
                        "can_upload": False,
                    }
                )
                running_snapshot = deepcopy(_UPLOAD_JOB_STATE)

        if current_status in UPLOAD_JOB_ACTIVE_STATUSES:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Proses upload excel sebelumnya masih berjalan. Mohon tunggu hingga selesai.",
                    "job_status": running_snapshot,
                },
            )

        INVAp2Service._publish_upload_job_state(running_snapshot)
        if scheduler_is_active:
            Thread(
                target=INVAp2Service._wait_scheduler_then_run_upload_job,
                kwargs={
                    "job_id": running_snapshot["job_id"],
                    "filename": filename,
                    "payload": payload,
                },
                daemon=True,
            ).start()
            return running_snapshot

        Thread(
            target=INVAp2Service._run_upload_invoice_excel_job,
            kwargs={
                "job_id": running_snapshot["job_id"],
                "filename": filename,
                "payload": payload,
            },
            daemon=True,
        ).start()
        return running_snapshot

    @staticmethod
    def _wait_scheduler_then_run_upload_job(job_id: str, filename: str, payload: bytes) -> None:
        logger.info(
            build_debug_message(
                DEBUG_SOURCE_UPLOAD_EXCEL,
                f"Upload menunggu scheduler selesai. job_id={job_id}",
            ),
            extra={
                "event": "invoice.upload_excel.wait_scheduler",
                "source": DEBUG_SOURCE_UPLOAD_EXCEL,
            },
        )
        while INVAp2Service._is_scheduler_job_active():
            sleep(2)

        INVAp2Service._update_upload_job_state(
            job_id=job_id,
            patch={
                "status": "queued",
                "progress": 0,
                "message": "Scheduler selesai. Job upload dimulai.",
                "scheduler_runs": [],
                "error": None,
            },
        )
        INVAp2Service._run_upload_invoice_excel_job(
            job_id=job_id, filename=filename, payload=payload
        )

    @staticmethod
    def _run_upload_invoice_excel_job(job_id: str, filename: str, payload: bytes) -> None:
        db = SessionDB1W()
        db2 = SessionDB2R()

        def progress_callback(progress: int, message: str) -> None:
            clamped_progress = max(0, min(99, int(progress)))
            INVAp2Service._update_upload_job_state(
                job_id=job_id,
                patch={
                    "status": "processing",
                    "progress": clamped_progress,
                    "message": message,
                    "error": None,
                },
            )

        try:
            progress_callback(5, "Membaca file excel...")
            result = INVAp2Service.upload_invoice_excel_payload(
                filename=filename,
                payload=payload,
                db=db,
                db2=db2,
                progress_callback=progress_callback,
            )
            INVAp2Service._update_upload_job_state(
                job_id=job_id,
                patch={
                    "status": "completed",
                    "progress": 100,
                    "message": result.get("message", "Upload invoice excel selesai diproses."),
                    "finished_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
                    "result": result,
                    "error": None,
                },
            )
        except HTTPException as exc:
            db.rollback()
            detail = exc.detail
            if isinstance(detail, dict):
                detail_message = str(
                    detail.get("message")
                    or detail.get("detail")
                    or "Gagal memproses upload invoice excel."
                )
            else:
                detail_message = str(detail or "Gagal memproses upload invoice excel.")
            INVAp2Service._update_upload_job_state(
                job_id=job_id,
                patch={
                    "status": "failed",
                    "progress": 100,
                    "message": detail_message,
                    "finished_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
                    "error": detail_message,
                },
            )
            logger.exception(
                build_debug_message(
                    DEBUG_SOURCE_UPLOAD_EXCEL, f"Job upload invoice excel gagal: {detail_message}"
                ),
                extra={
                    "event": "invoice.upload_excel.job_failed",
                    "source": DEBUG_SOURCE_UPLOAD_EXCEL,
                },
            )
        except Exception as exc:  # noqa: BLE001, RUF100
            db.rollback()
            detail_message = f"Gagal memproses upload invoice excel: {exc}"
            INVAp2Service._update_upload_job_state(
                job_id=job_id,
                patch={
                    "status": "failed",
                    "progress": 100,
                    "message": detail_message,
                    "finished_at": datetime.now().isoformat(timespec="seconds"),  # noqa: DTZ005
                    "error": detail_message,
                },
            )
            logger.exception(
                build_debug_message(DEBUG_SOURCE_UPLOAD_EXCEL, "Job upload invoice excel gagal."),
                extra={
                    "event": "invoice.upload_excel.job_failed",
                    "source": DEBUG_SOURCE_UPLOAD_EXCEL,
                },
            )
        finally:
            db.close()
            db2.close()

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
    def datatable(db: Session, params: DataTablesParams) -> DataTablesResponse[InvoiceGet]:
        # with task_name("Datatables"):
        # logger.info("Menampilkan semua data invoice")
        return inv_ap2_datatable_service.get_datatable(db=db, params=params)

    @staticmethod
    def _prepare_invoice_lookup_sql(raw_query: str) -> str:
        normalized_query = raw_query.strip().rstrip(";")
        normalized_query = HARI_PARAM_PATTERN.sub(":invoice_number", normalized_query)

        invoice_ref_match = INVOICE_COLUMN_REF_PATTERN.search(normalized_query)
        if invoice_ref_match:
            invoice_column_ref = f"{invoice_ref_match.group('prefix')}InvoiceNumber"
        else:
            date_ref_match = DATE_COLUMN_REF_PATTERN.search(normalized_query)
            invoice_column_ref = (
                f"{date_ref_match.group('prefix')}InvoiceNumber"
                if date_ref_match
                else "a.InvoiceNumber"
            )

        if INVOICE_FILTER_PATTERN.search(normalized_query):
            return normalized_query

        if SQL_DATE_FILTER_PATTERN.search(normalized_query):
            return SQL_DATE_FILTER_PATTERN.sub(
                f"{invoice_column_ref} = :invoice_number", normalized_query
            )

        if re.search(r"\bWHERE\b", normalized_query, flags=re.IGNORECASE):
            return f"{normalized_query}\n  AND {invoice_column_ref} = :invoice_number"

        return f"{normalized_query}\nWHERE {invoice_column_ref} = :invoice_number"

    @staticmethod
    @lru_cache(maxsize=1)
    def _build_lookup_query_texts() -> tuple[tuple[str, Any], ...]:
        query_texts: list[tuple[str, Any]] = []
        for path in QUERY_FILES_FOR_INVOICE_LOOKUP:
            raw_query = HELPER.load_sql_query(path)
            lookup_query = INVAp2Service._prepare_invoice_lookup_sql(raw_query)
            query_texts.append((path, text(lookup_query)))
        return tuple(query_texts)

    @staticmethod
    def _map_query_row_to_invoice_payload(row: dict[str, Any]) -> dict[str, Any]:
        payload: dict[str, Any] = {}
        for key, value in row.items():
            field_name = INVTOAP2INV.get(key, key)
            if field_name not in InvoiceCreate.model_fields:
                continue
            payload[field_name] = normalize_value(value)
        return payload

    @staticmethod
    def _lookup_invoice_reference_data(
        db2: Session,
        invoice_number: str,
        lookup_queries: list[tuple[str, Any]],
    ) -> tuple[dict[str, Any], str | None]:
        for query_path, query_sql in lookup_queries:
            try:
                result = (
                    db2.execute(query_sql, {"invoice_number": invoice_number}).mappings().first()
                )
            except Exception:
                logger.exception(
                    "Gagal lookup invoice %s dari query %s",
                    invoice_number,
                    query_path,
                )
                continue
            if result:
                return INVAp2Service._map_query_row_to_invoice_payload(dict(result)), query_path
        return {}, None

    @staticmethod
    def _lookup_dom_int_inc_out(db2: Session, invoice_number: str) -> dict[str, str]:
        try:
            row = (
                db2.execute(DOM_INC_OUT_SQL, {"invoice_number": invoice_number}).mappings().first()
            )
        except Exception:
            logger.exception("Gagal lookup DOM_INT/INC_OUT untuk invoice %s", invoice_number)
            return {}

        if not row:
            return {}

        result: dict[str, str] = {}
        if row.get("DOM_INT"):
            result["DOM_INT"] = str(row["DOM_INT"])
        if row.get("INC_OUT"):
            result["INC_OUT"] = str(row["INC_OUT"])
        return result

    @staticmethod
    def _get_excel_value(
        row: dict[str, Any], normalized_to_actual_col: dict[str, str], field: str
    ) -> Any:
        field_headers = INV_FIELD_TO_EXCEL_HEADERS.get(field, [])
        direct_headers = [field, field.replace("_", " ")]
        for candidate in [*field_headers, *direct_headers]:
            actual_col = normalized_to_actual_col.get(normalize_excel_header(candidate))
            if not actual_col:
                continue
            value = normalize_value(row.get(actual_col))
            if not is_empty_value(value):
                return value
        return None

    @staticmethod
    def upload_invoice_excel(file: UploadFile, db: Session, db2: Session) -> dict[str, Any]:
        logger.info(
            build_debug_message(
                DEBUG_SOURCE_UPLOAD_EXCEL, f"Upload invoice AP2 via excel: {file.filename}"
            ),
            extra={"event": "invoice.upload_excel.start", "source": DEBUG_SOURCE_UPLOAD_EXCEL},
        )
        dataframe = read_excel_upload(file=file)
        return INVAp2Service._upload_invoice_excel_dataframe(dataframe=dataframe, db=db, db2=db2)

    @staticmethod
    def upload_invoice_excel_payload(
        filename: str,
        payload: bytes,
        db: Session,
        db2: Session,
        progress_callback: Callable[[int, str], None] | None = None,
    ) -> dict[str, Any]:
        logger.info(
            build_debug_message(
                DEBUG_SOURCE_UPLOAD_EXCEL,
                f"Upload invoice AP2 via excel (job): {filename}",
            ),
            extra={"event": "invoice.upload_excel.job", "source": DEBUG_SOURCE_UPLOAD_EXCEL},
        )
        dataframe = read_excel_upload_payload(filename=filename, payload=payload)
        return INVAp2Service._upload_invoice_excel_dataframe(
            dataframe=dataframe,
            db=db,
            db2=db2,
            progress_callback=progress_callback,
        )

    @staticmethod
    def _upload_invoice_excel_dataframe(  # noqa: PLR0912, PLR0915
        dataframe: pd.DataFrame,
        db: Session,
        db2: Session,
        progress_callback: Callable[[int, str], None] | None = None,
    ) -> dict[str, Any]:
        if dataframe.empty:
            raise HTTPException(status_code=400, detail="File Excel tidak memiliki data.")

        if progress_callback:
            progress_callback(10, "Menyiapkan struktur kolom file excel...")

        normalized_to_actual_col = {
            normalize_excel_header(column): column for column in dataframe.columns
        }
        lookup_queries = INVAp2Service._build_lookup_query_texts()
        invoice_lookup_cache: dict[str, dict[str, Any]] = {}
        invoice_lookup_source_cache: dict[str, str | None] = {}
        dom_inc_lookup_cache: dict[str, dict[str, str]] = {}

        pending_records: list[dict[str, Any]] = []
        validation_errors: list[dict[str, Any]] = []
        source_not_found_invoices: list[str] = []
        rows = dataframe.to_dict(orient="records")
        total_rows = len(rows)
        last_progress = 15

        if progress_callback:
            progress_callback(15, f"Memproses {total_rows} baris data excel...")

        for row_idx, row in enumerate(rows, start=2):
            if all(is_empty_value(value) for value in row.values()):
                if progress_callback and total_rows:
                    processed = row_idx - 1
                    if processed == total_rows or processed % 25 == 0:
                        next_progress = 15 + int((processed / total_rows) * 60)
                        next_progress = min(next_progress, 75)
                        if next_progress > last_progress:
                            last_progress = next_progress
                            progress_callback(
                                next_progress, f"Memproses baris {processed}/{total_rows}..."
                            )
                continue

            mapped_row: dict[str, Any] = dict(INVTOAP2INV_BASE)
            mapped_row["status"] = 0

            for field in InvoiceCreate.model_fields:
                excel_value = INVAp2Service._get_excel_value(row, normalized_to_actual_col, field)
                if excel_value is not None:
                    mapped_row[field] = excel_value

            # Kolom KADE tidak tersedia di template mastersiogo; defaultkan "0" jika kosong.
            if is_empty_value(mapped_row.get("KADE")):
                mapped_row["KADE"] = "0"

            invoice_number = normalize_value(mapped_row.get("NO_INVOICE"))
            invoice_number = str(invoice_number).strip() if invoice_number is not None else ""

            if not invoice_number:
                validation_errors.append(
                    {
                        "row": row_idx,
                        "invoice": None,
                        "error": "NO_INVOICE / Invoice No wajib diisi.",
                    }
                )
                continue

            mapped_row["NO_INVOICE"] = invoice_number

            if invoice_number not in invoice_lookup_cache:
                ref_payload, source_query = INVAp2Service._lookup_invoice_reference_data(
                    db2=db2,
                    invoice_number=invoice_number,
                    lookup_queries=lookup_queries,
                )
                invoice_lookup_cache[invoice_number] = ref_payload
                invoice_lookup_source_cache[invoice_number] = source_query
            ref_data = invoice_lookup_cache[invoice_number]
            source_query = invoice_lookup_source_cache.get(invoice_number)
            for field, value in ref_data.items():
                if is_empty_value(mapped_row.get(field)):
                    mapped_row[field] = value

            if invoice_number not in dom_inc_lookup_cache:
                dom_inc_lookup_cache[invoice_number] = INVAp2Service._lookup_dom_int_inc_out(
                    db2=db2, invoice_number=invoice_number
                )
            dom_inc_data = dom_inc_lookup_cache[invoice_number]
            if dom_inc_data.get("DOM_INT"):
                mapped_row["DOM_INT"] = dom_inc_data["DOM_INT"]
            if dom_inc_data.get("INC_OUT"):
                mapped_row["INC_OUT"] = dom_inc_data["INC_OUT"]

            if (
                is_empty_value(mapped_row.get("JENIS_KARGO"))
                and mapped_row.get("DOM_INT") == "I"
                and mapped_row.get("INC_OUT") == "O"
            ):
                jenis_kargo = ref_data.get("JENIS_KARGO")
                if jenis_kargo:
                    mapped_row["JENIS_KARGO"] = jenis_kargo

            mapped_row["status"] = 0
            mapped_row["NO_INVOICE"] = str(mapped_row["NO_INVOICE"])

            for int_field in INT_FIELDS:
                if int_field in mapped_row:
                    mapped_row[int_field] = sanitize_number_for_int(mapped_row[int_field])

            missing_required_fields = get_missing_required_invoice_fields(mapped_row)
            if missing_required_fields and not ref_data:
                source_not_found_invoices.append(invoice_number)
                validation_errors.append(
                    {
                        "row": row_idx,
                        "invoice": invoice_number,
                        "error": (
                            "Invoice tidak ditemukan pada source query "
                            "(get_inv_export/get_inv_import/get_inv_outgoing)."
                        ),
                        "missing_fields": missing_required_fields,
                    }
                )
                continue

            try:
                payload = InvoiceCreate(**mapped_row).model_dump()
            except Exception as exc:
                validation_errors.append(
                    {
                        "row": row_idx,
                        "invoice": invoice_number,
                        "source_query": source_query,
                        "error": str(exc),
                    }
                )
                continue

            pending_records.append(payload)

            if progress_callback and total_rows:
                processed = row_idx - 1
                if processed == total_rows or processed % 25 == 0:
                    next_progress = 15 + int((processed / total_rows) * 60)
                    next_progress = min(next_progress, 75)
                    if next_progress > last_progress:
                        last_progress = next_progress
                        progress_callback(
                            next_progress, f"Memproses baris {processed}/{total_rows}..."
                        )

        if not pending_records:
            if progress_callback:
                progress_callback(100, "Tidak ada data valid untuk diinsert.")
            return {
                "message": "Tidak ada data valid untuk diinsert.",
                "inserted": 0,
                "skipped_existing": 0,
                "updated_existing_status": 0,
                "skipped_duplicate_file": 0,
                "source_not_found_invoices": sorted(set(source_not_found_invoices)),
                "errors": validation_errors,
            }

        if progress_callback:
            progress_callback(80, "Memvalidasi duplikasi invoice...")

        unique_invoice_numbers = {
            str(no_inv)
            for no_inv in (record.get("NO_INVOICE") for record in pending_records)
            if no_inv is not None
        }
        existing_numbers: set[str] = set()
        if unique_invoice_numbers:
            existing_numbers = {
                str(existing_no)
                for (existing_no,) in db.query(InvAp2.NO_INVOICE)
                .filter(InvAp2.NO_INVOICE.in_(unique_invoice_numbers))
                .all()
            }

        records_to_insert: list[dict[str, Any]] = []
        seen_in_file: set[str] = set()
        existing_numbers_to_reset_status: set[str] = set()
        skipped_existing = 0
        skipped_duplicate_file = 0

        for record in pending_records:
            invoice_number = str(record.get("NO_INVOICE", "")).strip()
            if invoice_number in existing_numbers:
                skipped_existing += 1
                existing_numbers_to_reset_status.add(invoice_number)
                continue
            if invoice_number in seen_in_file:
                skipped_duplicate_file += 1
                continue
            seen_in_file.add(invoice_number)
            records_to_insert.append(record)

        if progress_callback:
            progress_callback(90, "Menyimpan data invoice ke database...")

        if records_to_insert or existing_numbers_to_reset_status:
            try:
                if existing_numbers_to_reset_status:
                    db.query(InvAp2).filter(
                        InvAp2.NO_INVOICE.in_(existing_numbers_to_reset_status)
                    ).update(
                        {InvAp2.status: 0},
                        synchronize_session=False,
                    )

                if records_to_insert:
                    db.bulk_insert_mappings(InvAp2, records_to_insert)  # type: ignore[arg-type]
                db.commit()
            except Exception as exc:
                db.rollback()
                logger.exception(
                    build_debug_message(
                        DEBUG_SOURCE_UPLOAD_EXCEL,
                        "Gagal simpan upload invoice AP2 via excel.",
                    ),
                    extra={
                        "event": "invoice.upload_excel.error",
                        "source": DEBUG_SOURCE_UPLOAD_EXCEL,
                    },
                )
                raise HTTPException(
                    status_code=500,
                    detail="Gagal menyimpan data upload invoice AP2.",
                ) from exc

        if progress_callback:
            progress_callback(99, "Finalisasi proses upload invoice...")

        return {
            "message": "Upload invoice excel selesai diproses.",
            "inserted": len(records_to_insert),
            "skipped_existing": skipped_existing,
            "updated_existing_status": len(existing_numbers_to_reset_status),
            "skipped_duplicate_file": skipped_duplicate_file,
            "source_not_found_invoices": sorted(set(source_not_found_invoices)),
            "errors": validation_errors,
        }

    # Dipanggil oleh APScheduler (lihat app/job/scheduler.py -> job id: get_data_inv_job, interval: 60 menit)
    # Fungsi ini sinkronisasi data invoice dari MySQL2 ke tabel inv_ap2 di MySQL1.
    # Catatan debug:
    # - Upload excel invoice dan scheduler dapat berjalan di waktu yang berdekatan.
    # - Gunakan `source` + `run_id` pada log/payload untuk bedakan alur eksekusi.
    @staticmethod
    def get_data_inv():  # noqa: PLR0912, PLR0915
        run_id = uuid4().hex[:8]
        if not DB2_INV_SYNC_ENABLED:
            logger.warning(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SYNC,
                    "Job get_data_inv dinonaktifkan via konfigurasi DB2_INV_SYNC_ENABLED.",
                    run_id,
                ),
                extra={
                    "event": "invoice.sync.disabled",
                    "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                    "run_id": run_id,
                },
            )
            return
        INVAp2Service._register_scheduler_run(source=DEBUG_SOURCE_SCHEDULER_SYNC, run_id=run_id)
        logger.info(
            build_debug_message(
                DEBUG_SOURCE_SCHEDULER_SYNC,
                "Sync data invoice untuk di send dari mysql2 ke mysql1",
                run_id,
            ),
            extra={
                "event": "invoice.sync.start",
                "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                "run_id": run_id,
            },
        )
        if INVAp2Service._is_upload_job_active():
            logger.warning(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SYNC,
                    "Upload excel invoice sedang berjalan; scheduler sync tetap diproses.",
                    run_id,
                ),
                extra={
                    "event": "invoice.sync.concurrent_upload",
                    "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                    "run_id": run_id,
                },
            )
        INVAp2Service._publish_scheduler_event(
            source=DEBUG_SOURCE_SCHEDULER_SYNC,
            run_id=run_id,
            message="Mulai sinkronisasi invoice DB2 -> inv_ap2",
        )
        db1 = SessionDB1W()
        db2 = SessionDB2R()
        try:
            params = get_dynamic_params()
            logger.info(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SYNC, f"Parameter query: {params}", run_id
                ),
                extra={
                    "event": "invoice.sync.params",
                    "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                    "run_id": run_id,
                    "params": params,
                },
            )

            # Kumpulan query sumber data invoice
            query_files = [
                "app/repository/query/get_inv_export.sql",
                "app/repository/query/get_inv_import.sql",
                "app/repository/query/get_inv_outgoing.sql",
            ]

            pending_records: list[dict] = []

            for qpath in query_files:
                query = HELPER.load_sql_query(qpath)
                sql = text(query)
                rows = db2.execute(sql, params).mappings().all()
                logger.info(
                    build_debug_message(
                        DEBUG_SOURCE_SCHEDULER_SYNC,
                        f"Loaded {len(rows)} rows from {qpath}",
                        run_id,
                    ),
                    extra={
                        "event": "invoice.sync.query_loaded",
                        "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                        "run_id": run_id,
                        "query_file": qpath,
                        "row_count": len(rows),
                    },
                )
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
                logger.info(
                    build_debug_message(
                        DEBUG_SOURCE_SCHEDULER_SYNC,
                        "Tidak ada data invoice yang ditemukan untuk sinkronisasi",
                        run_id,
                    ),
                    extra={
                        "event": "invoice.sync.empty",
                        "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                        "run_id": run_id,
                    },
                )
                INVAp2Service._publish_scheduler_event(
                    source=DEBUG_SOURCE_SCHEDULER_SYNC,
                    run_id=run_id,
                    message="Tidak ada data invoice untuk sinkronisasi",
                )
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
                    logger.warning(
                        build_debug_message(
                            DEBUG_SOURCE_SCHEDULER_SYNC,
                            "NO_INVOICE tidak tersedia, jalankan insert baru",
                            run_id,
                        ),
                        extra={
                            "event": "invoice.sync.missing_no_invoice",
                            "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                            "run_id": run_id,
                        },
                    )

                records_to_insert.append(values)

            if not records_to_insert:
                logger.info(
                    build_debug_message(
                        DEBUG_SOURCE_SCHEDULER_SYNC,
                        "Semua invoice sudah ada, tidak ada data baru untuk ditambahkan",
                        run_id,
                    ),
                    extra={
                        "event": "invoice.sync.no_new_data",
                        "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                        "run_id": run_id,
                    },
                )
                INVAp2Service._publish_scheduler_event(
                    source=DEBUG_SOURCE_SCHEDULER_SYNC,
                    run_id=run_id,
                    message="Semua invoice sudah ada, tidak ada data baru untuk ditambahkan",
                )
                return

            db1.bulk_insert_mappings(InvAp2, records_to_insert)  # type: ignore

            logger.info(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SYNC,
                    f"Berhasil menambahkan {len(records_to_insert)} invoice baru ke inv_ap2 (lewati {skipped} duplikat)",
                    run_id,
                ),
                extra={
                    "event": "invoice.sync.success",
                    "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                    "run_id": run_id,
                    "inserted": len(records_to_insert),
                    "skipped_duplicates": skipped,
                },
            )
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SYNC,
                run_id=run_id,
                message=(
                    f"Berhasil menambahkan {len(records_to_insert)} invoice baru ke inv_ap2 "
                    f"(lewati {skipped} duplikat)"
                ),
                inserted=len(records_to_insert),
                skipped_duplicates=skipped,
            )

            db1.commit()
        except Exception as e:
            db1.rollback()
            logger.error(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SYNC,
                    f"Error sync breakdown: {e}",
                    run_id,
                ),
                exc_info=True,
                extra={
                    "event": "invoice.sync.error",
                    "source": DEBUG_SOURCE_SCHEDULER_SYNC,
                    "run_id": run_id,
                },
            )
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SYNC,
                run_id=run_id,
                message=f"Info: {e!s}",
                level="error",
            )
        finally:
            INVAp2Service._unregister_scheduler_run(run_id=run_id)
            db1.close()
            db2.close()

    @staticmethod
    def _send_single_invoice_to_ap2(
        *, db1: Session, client: requests.Session, row: Any, run_id: str
    ) -> dict[str, Any]:
        row_dict = dict(row._mapping)
        schema = AP2SendInv(USR=ENV.AP2_USER, PSW=ENV.AP2_PASSWORD, **row_dict)
        payload = schema.model_dump()

        inv_no = payload.get("NO_INVOICE")
        invoice_value = str(inv_no) if inv_no is not None else None
        INVAp2Service._publish_scheduler_event(
            source=DEBUG_SOURCE_SCHEDULER_SEND,
            run_id=run_id,
            message=f"Kirim invoice: {inv_no}",
            invoice=invoice_value,
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
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Info: {e!s}",
                level="error",
                invoice=invoice_value,
            )
        finally:
            if inv_no:
                update_payload: dict[str, Any] = {"status": 1 if success else 2}
                if success:
                    update_payload["void"] = 0
                (
                    db1.query(InvAp2)
                    .filter(str(inv_no) == InvAp2.NO_INVOICE)
                    .update(update_payload, synchronize_session=False)
                )

        db1.add(
            ResponsInvAp2(
                inv=invoice_value,
                response=dumps(response_data),
                status=response_data["status"],
            )
        )

        if success:
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Berhasil invoice: {inv_no} (HTTP {response_data['status']})",
                invoice=invoice_value,
                http_status=response_data["status"],
            )
        else:
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Gagal invoice: {inv_no} (HTTP {response_data['status']})",
                level="error",
                invoice=invoice_value,
                http_status=response_data["status"],
            )

        return {"invoice": inv_no, **response_data}

    # Dipanggil oleh APScheduler (lihat app/job/scheduler.py -> job id: send_invoice_job, interval: 10 menit)
    # Fungsi ini mengirim invoice berstatus pending (status=0) ke API AP2.
    @staticmethod
    def send_invoice():
        run_id = uuid4().hex[:8]
        INVAp2Service._register_scheduler_run(source=DEBUG_SOURCE_SCHEDULER_SEND, run_id=run_id)
        logger.info(
            build_debug_message(
                DEBUG_SOURCE_SCHEDULER_SEND, "Mulai proses kirim invoice ke AP2", run_id
            ),
            extra={
                "event": "invoice.send.start",
                "source": DEBUG_SOURCE_SCHEDULER_SEND,
                "run_id": run_id,
            },
        )
        db1 = SessionDB1W()
        results = []
        try:
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message="Mulai kirim invoice",
            )

            sql = text("SELECT * FROM inv_ap2 WHERE status = 0 LIMIT 100")
            rows = db1.execute(sql).fetchall()
            if not rows:
                msg = "Invoice not found"
                logger.info(
                    build_debug_message(
                        DEBUG_SOURCE_SCHEDULER_SEND,
                        "Tidak ada invoice baru yang siap dikirim",
                        run_id,
                    ),
                    extra={
                        "event": "invoice.send.empty",
                        "source": DEBUG_SOURCE_SCHEDULER_SEND,
                        "run_id": run_id,
                    },
                )
                INVAp2Service._publish_scheduler_event(
                    source=DEBUG_SOURCE_SCHEDULER_SEND,
                    run_id=run_id,
                    message=msg,
                )
                db1.commit()
                return []

            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Ditemukan {len(rows)} invoice untuk dikirim",
                pending_count=len(rows),
            )

            with requests.Session() as client:
                for row in rows:
                    results.append(
                        INVAp2Service._send_single_invoice_to_ap2(
                            db1=db1,
                            client=client,
                            row=row,
                            run_id=run_id,
                        )
                    )

            db1.commit()
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Selesai kirim {len(results)} invoice",
                sent_count=len(results),
            )
            logger.info(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SEND,
                    f"Selesai kirim {len(results)} invoice ke AP2",
                    run_id,
                ),
                extra={
                    "event": "invoice.send.complete",
                    "source": DEBUG_SOURCE_SCHEDULER_SEND,
                    "run_id": run_id,
                    "count": len(results),
                },
            )
        except Exception as e:
            db1.rollback()
            logger.exception(
                build_debug_message(
                    DEBUG_SOURCE_SCHEDULER_SEND, "Gagal mengirim invoice ke AP2", run_id
                ),
                extra={
                    "event": "invoice.send.error",
                    "source": DEBUG_SOURCE_SCHEDULER_SEND,
                    "run_id": run_id,
                },
            )
            INVAp2Service._publish_scheduler_event(
                source=DEBUG_SOURCE_SCHEDULER_SEND,
                run_id=run_id,
                message=f"Info: {e!s}",
                level="error",
            )
            raise
        finally:
            INVAp2Service._unregister_scheduler_run(run_id=run_id)
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
        invoice_number = str(request.NO_INVOICE or "").strip()
        if not invoice_number:
            raise HTTPException(status_code=400, detail="NO_INVOICE wajib diisi.")

        invoice_row = db.query(InvAp2).filter(invoice_number == InvAp2.NO_INVOICE).first()
        if not invoice_row:
            raise HTTPException(status_code=404, detail="Invoice tidak ditemukan di inv_ap2.")

        if int(invoice_row.void or 0) == 1:
            return VoidInvoiceSchemaResponse(
                TANGGAL=str(invoice_row.TANGGAL),
                NO_INVOICE=invoice_number,
                HAWB=request.HAWB or getattr(invoice_row, "HAWB", None),
                SMU=request.SMU or getattr(invoice_row, "SMU", None),
                success=True,
                message="Invoice sudah berstatus void.",
                status="200",
                affected_rows=0,
                void=1,
                response={"message": "Invoice sudah berstatus void.", "status": "200"},
            )

        invoice_date = normalize_void_timestamp(str(getattr(invoice_row, "TANGGAL", "") or ""))
        request_date = normalize_void_timestamp(request.TANGGAL or "")
        if request_date and invoice_date and request_date != invoice_date:
            logger.warning(
                "Void invoice dibatalkan (fail-fast): tanggal tidak sesuai | invoice=%s | request_tanggal=%s | invoice_tanggal=%s",
                invoice_number,
                request_date,
                invoice_date,
                extra={"event": "invoice.void.validation_failed", "invoice": invoice_number},
            )
            return VoidInvoiceSchemaResponse(
                TANGGAL=request_date,
                NO_INVOICE=invoice_number,
                HAWB=request.HAWB or getattr(invoice_row, "HAWB", None),
                SMU=request.SMU or getattr(invoice_row, "SMU", None),
                success=False,
                message="TANGGAL tidak sesuai dengan data invoice.",
                status="400",
                affected_rows=0,
                void=int(invoice_row.void or 0),
                response={
                    "error_type": "validation_error",
                    "field": "TANGGAL",
                    "message": "TANGGAL tidak sesuai dengan data invoice.",
                },
            )

        invoice_smu = str(getattr(invoice_row, "SMU", "") or "").strip()
        request_smu = str(request.SMU or "").strip()
        if request_smu and invoice_smu and request_smu != invoice_smu:
            logger.warning(
                "Void invoice dibatalkan (fail-fast): SMU tidak sesuai | invoice=%s | request_smu=%s | invoice_smu=%s",
                invoice_number,
                request_smu,
                invoice_smu,
                extra={"event": "invoice.void.validation_failed", "invoice": invoice_number},
            )
            return VoidInvoiceSchemaResponse(
                TANGGAL=request_date or invoice_date,
                NO_INVOICE=invoice_number,
                HAWB=request.HAWB or getattr(invoice_row, "HAWB", None),
                SMU=request_smu,
                success=False,
                message="SMU tidak sesuai dengan data invoice.",
                status="400",
                affected_rows=0,
                void=int(invoice_row.void or 0),
                response={
                    "error_type": "validation_error",
                    "field": "SMU",
                    "message": "SMU tidak sesuai dengan data invoice.",
                },
            )

        ext_request = VoidInvoiceSchemaRequest(
            TANGGAL=request_date or invoice_date,
            NO_INVOICE=invoice_number,
            # HAWB=request.HAWB or getattr(invoice_row, "HAWB", "") or "",
            SMU=request_smu or invoice_smu,
            USR=ENV.AP2_DEV_USER,
            PSW=ENV.AP2_DEV_PASSWORD,
        )

        payload = {
            "USR": (None, str(ext_request.USR)),
            "PSW": (None, str(ext_request.PSW)),
            "TANGGAL": (None, str(ext_request.TANGGAL)),
            "NO_INVOICE": (None, str(ext_request.NO_INVOICE)),
            "SMU": (None, str(ext_request.SMU or "")),
        }
        endpoint = f"{ENV.AP2_DEV_URL}/api/void_invo_dtl_v1"
        audit_request_payload = {
            "USR": str(ext_request.USR),
            "PSW": "******",
            "TANGGAL": str(ext_request.TANGGAL),
            "NO_INVOICE": str(ext_request.NO_INVOICE),
            "SMU": str(ext_request.SMU or ""),
        }
        logger.info(
            "Audit request void invoice SIGO | invoice=%s | endpoint=%s | timeout_seconds=%s | request_payload=%s",
            invoice_number,
            endpoint,
            AP2_VOID_TIMEOUT_SECONDS,
            dumps(audit_request_payload, ensure_ascii=False),
            extra={
                "event": "invoice.void.audit.request",
                "invoice": invoice_number,
                "endpoint": endpoint,
                "timeout_seconds": AP2_VOID_TIMEOUT_SECONDS,
                "request_payload": audit_request_payload,
            },
        )
        try:
            async with httpx.AsyncClient(timeout=AP2_VOID_HTTPX_TIMEOUT) as client:
                resp = await client.post(
                    endpoint,
                    headers=AP2_DEV_VOID_HEADERS,
                    files=payload,
                )
        except httpx.TimeoutException as exc:
            logger.error(
                "Timeout saat menghubungi AP2 untuk void invoice %s",
                invoice_number,
                exc_info=exc,
                extra={
                    "event": "invoice.void.timeout",
                    "invoice": invoice_number,
                    "endpoint": endpoint,
                    "request_payload": audit_request_payload,
                },
            )
            return VoidInvoiceSchemaResponse(
                TANGGAL=ext_request.TANGGAL,
                NO_INVOICE=invoice_number,
                HAWB=ext_request.HAWB,
                SMU=ext_request.SMU,
                success=False,
                message="AP2 timeout: tidak ada respons sebelum batas waktu.",
                status="timeout",
                affected_rows=0,
                void=int(invoice_row.void or 0),
                response={
                    "error_type": "timeout",
                    "error": str(exc),
                    "endpoint": endpoint,
                    "timeout_seconds": AP2_VOID_TIMEOUT_SECONDS,
                },
            )
        except httpx.RequestError as exc:
            logger.error(
                "Gagal menghubungi AP2 untuk void invoice %s",
                invoice_number,
                exc_info=exc,
                extra={
                    "event": "invoice.void.connection_error",
                    "invoice": invoice_number,
                    "endpoint": endpoint,
                    "request_payload": audit_request_payload,
                },
            )

            return VoidInvoiceSchemaResponse(
                TANGGAL=ext_request.TANGGAL,
                NO_INVOICE=invoice_number,
                HAWB=ext_request.HAWB,
                SMU=ext_request.SMU,
                success=False,
                message="Gagal menghubungi AP2.",
                status="request_error",
                affected_rows=0,
                void=int(invoice_row.void or 0),
                response={
                    "error_type": "request_error",
                    "error": str(exc),
                    "endpoint": endpoint,
                },
            )

        response_text = (resp.text or "")[:5000]
        try:
            resp_json = resp.json()
        except ValueError:
            resp_json = {
                "message": resp.text[:255] if resp.text else f"HTTP {resp.status_code}",
                "affected_rows": 0,
                "status": str(resp.status_code),
            }
        logger.info(
            "Audit response void invoice SIGO | invoice=%s | endpoint=%s | http_status=%s | response_json=%s | response_text=%s",
            invoice_number,
            endpoint,
            resp.status_code,
            dumps(resp_json, ensure_ascii=False),
            response_text,
            extra={
                "event": "invoice.void.audit.response",
                "invoice": invoice_number,
                "endpoint": endpoint,
                "http_status": resp.status_code,
                "request_payload": audit_request_payload,
                "response_json": resp_json,
                "response_text": response_text,
            },
        )

        status_value = str(resp_json.get("status") or resp.status_code)
        message_value = str(resp_json.get("message") or f"HTTP {resp.status_code}")
        try:
            affected_rows = int(resp_json.get("affected_rows") or 0)
        except (TypeError, ValueError):
            affected_rows = 0

        is_success = is_ap2_void_success(resp.status_code, resp_json)
        if is_success:
            try:
                (
                    db.query(InvAp2)
                    .filter(invoice_number == InvAp2.NO_INVOICE)
                    .update({"void": 1}, synchronize_session=False)
                )
                db.commit()
            except Exception as exc:  # pragma: no cover - defensive
                db.rollback()
                logger.exception(
                    "Gagal update void invoice pada inv_ap2 untuk %s",
                    invoice_number,
                    extra={"event": "invoice.void.update_error", "invoice": invoice_number},
                )
                raise HTTPException(
                    status_code=500, detail="Gagal update status void invoice pada inv_ap2."
                ) from exc

        return VoidInvoiceSchemaResponse(
            TANGGAL=ext_request.TANGGAL,
            NO_INVOICE=invoice_number,
            HAWB=ext_request.HAWB,
            SMU=ext_request.SMU,
            success=is_success,
            message=message_value,
            status=status_value,
            affected_rows=affected_rows,
            void=1 if is_success else int(invoice_row.void or 0),
            response=resp_json,
        )

    @staticmethod
    def report_invoice_daily_counter(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[InvoiceDailyCounterGet]:
        return invoice_daily_counter_datatable.get_datatable(db=db, params=params)

    @staticmethod
    def report_invoice_monthly(db: Session, tahun: int) -> list[InvoiceDailyCounterMonthlySummary]:
        rows = (
            db.query(
                func.year(InvoiceDailyCounter.tanggal).label("year"),
                func.month(InvoiceDailyCounter.tanggal).label("month"),
                func.coalesce(func.sum(InvoiceDailyCounter.jumlah_invoice), 0).label("total_sent"),
            )
            .filter(func.year(InvoiceDailyCounter.tanggal) == tahun)
            .group_by(
                func.year(InvoiceDailyCounter.tanggal),
                func.month(InvoiceDailyCounter.tanggal),
            )
            .order_by(
                func.year(InvoiceDailyCounter.tanggal),
                func.month(InvoiceDailyCounter.tanggal),
            )
            .all()
        )

        return [
            InvoiceDailyCounterMonthlySummary(
                year=int(row.year),
                month=int(row.month),
                total_sent=int(row.total_sent or 0),
            )
            for row in rows
            if row.year is not None and row.month is not None
        ]

    @staticmethod
    def report_invoice_status_summary(db: Session, tanggal: str | None = None) -> InvoiceStatusSummary:
        if tanggal:
            if not MONTH_PATTERN.match(tanggal):
                raise HTTPException(
                    status_code=400, detail="Format tanggal tidak valid. Gunakan YYYY-MM."
                )
            month_prefix = tanggal
        else:
            month_prefix = None

        query = db.query(
            func.coalesce(func.sum(case((InvAp2.status == 1, 1), else_=0)), 0).label(
                "total_terkirim"
            ),
            func.coalesce(func.sum(case((InvAp2.status == 0, 1), else_=0)), 0).label(
                "total_belum_terkirim"
            ),
        )

        if month_prefix:
            query = query.filter(InvAp2.TANGGAL.like(f"{month_prefix}%"))

        result = query.one()

        return InvoiceStatusSummary(
            total_terkirim=int(result.total_terkirim or 0),
            total_belum_terkirim=int(result.total_belum_terkirim or 0),
        )
