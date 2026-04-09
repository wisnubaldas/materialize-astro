import json
import logging
import re
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from jinja2 import Environment, FileSystemLoader, select_autoescape
from openpyxl import load_workbook
from openpyxl.utils.datetime import from_excel
from sqlalchemy import tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from xhtml2pdf import pisa

from app.models.BaseDB1.exp_manifest_fligt import ExpManifestFligt
from app.models.BaseDB1.exp_manifest_mawb import ExpManifestMawb
from app.models.BaseDB1.exp_manifest_summary import ExpManifestSummary
from app.models.BaseDB1.exp_manifest_uld import ExpManifestUld
from app.utils.helper import PDF_DIR

logger = logging.getLogger("warehouse")

FLIGHT_HEADERS = [
    "airline_code",
    "flight_number",
    "flight_date",
    "aircraft_registration",
    "point_of_loading",
    "point_of_unloading",
    "total_pieces",
    "total_weight_kg",
    "source_document",
    "raw_text",
]

ULD_HEADERS = [
    "flight_number",
    "flight_date",
    "uld_type",
    "uld_number",
    "uld_owner",
    "destination",
    "remarks",
]

MAWB_HEADERS = [
    "flight_number",
    "flight_date",
    "uld_type",
    "uld_number",
    "mawb_prefix",
    "mawb_number",
    "pieces",
    "total_pieces",
    "weight_kg",
    "nature_of_goods",
    "route",
    "transit_flag",
]

MAWB_HEADERS_LEGACY = [
    "flight_number",
    "flight_date",
    "uld_type",
    "uld_number",
    "mawb_prefix",
    "mawb_number",
    "pieces",
    "weight_kg",
    "nature_of_goods",
    "route",
    "transit_flag",
]

ALLOWED_EXTENSIONS = (".xlsx", ".xlsm")
EXCEL_DIR = PDF_DIR.parent / "excel"


def _normalize_headers(raw_headers: tuple) -> list[str | None]:
    headers: list[str | None] = []
    for header in raw_headers:
        if header is None:
            headers.append(None)
            continue
        if isinstance(header, str):
            headers.append(header.strip())
        else:
            headers.append(str(header).strip())
    while headers and headers[-1] is None:
        headers.pop()
    return headers


def _row_has_values(row: tuple) -> bool:
    for value in row:
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        return True
    return False


def _normalize_identifier(value, pad: int | None = None) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        result = value.strip()
    elif isinstance(value, float):
        result = str(int(value)) if value.is_integer() else str(value)
    else:
        result = str(value).strip()
    if pad:
        return result.zfill(pad)
    return result


def _parse_date(value, field: str, row_idx: int) -> date:
    if value is None or value == "":
        raise HTTPException(status_code=400, detail=f"{field} kosong di baris {row_idx}.")
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)):
        try:
            parsed = from_excel(value)
            return parsed.date() if isinstance(parsed, datetime) else parsed
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Format tanggal {field} tidak valid di baris {row_idx}."
            ) from exc
    if isinstance(value, str):
        raw = value.strip()
        for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc).date()
            except ValueError:
                continue
    raise HTTPException(
        status_code=400, detail=f"Format tanggal {field} tidak valid di baris {row_idx}."
    )


def _to_int(value, field: str, row_idx: int, default: int = 0) -> int:
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Format {field} tidak valid di baris {row_idx}."
        ) from exc


def _to_decimal(value, field: str, row_idx: int, default: Decimal = Decimal("0")) -> Decimal:
    if value in (None, ""):
        return default
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Format {field} tidak valid di baris {row_idx}."
        ) from exc


def _to_bool(value) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return int(value) != 0
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "y")
    return False


def _read_headers(ws, expected: list[str], sheet_name: str) -> list[str | None]:
    header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)
    if not header_row:
        raise HTTPException(status_code=400, detail=f"Sheet {sheet_name} tidak memiliki header.")
    headers = _normalize_headers(header_row)
    if headers != expected:
        raise HTTPException(
            status_code=400,
            detail={
                "message": f"Header sheet {sheet_name} tidak sesuai.",
                "error": {"header_file_upload": headers, "header_file_valid": expected},
            },
        )
    return headers


def _read_headers_any(
    ws, expected_groups: list[list[str]], sheet_name: str
) -> list[str | None]:
    header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)
    if not header_row:
        raise HTTPException(status_code=400, detail=f"Sheet {sheet_name} tidak memiliki header.")
    headers = _normalize_headers(header_row)
    for expected in expected_groups:
        if headers == expected:
            return headers
    raise HTTPException(
        status_code=400,
        detail={
            "message": f"Header sheet {sheet_name} tidak sesuai.",
            "error": {"header_file_upload": headers, "header_file_valid": expected_groups},
        },
    )


def _format_decimal(value: Decimal) -> str:
    try:
        return f"{value:.2f}"
    except Exception:
        return str(value)


def _sanitize_filename(filename: str, default_stem: str = "manifest") -> str:
    safe_name = Path(filename or "").name
    stem = Path(safe_name).stem
    suffix = Path(safe_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        suffix = ".xlsx"

    cleaned_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-")
    if not cleaned_stem:
        cleaned_stem = default_stem

    return f"{cleaned_stem}{suffix}"


class BuildupService:
    @staticmethod
    def _build_workbook_from_payload(payload_json: str) -> tuple[bytes, str]:
        try:
            payload = json.loads(payload_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Format payload_json tidak valid.") from exc

        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="payload_json harus berupa object.")

        flight_rows = payload.get("flight_manifest", [])
        uld_rows = payload.get("uld", [])
        mawb_rows = payload.get("mawb", [])
        if not isinstance(flight_rows, list) or not isinstance(uld_rows, list) or not isinstance(
            mawb_rows, list
        ):
            raise HTTPException(
                status_code=400,
                detail="payload_json harus memiliki array: flight_manifest, uld, dan mawb.",
            )

        from openpyxl import Workbook

        wb = Workbook()
        ws_flight = wb.active
        ws_flight.title = "flight_manifest"
        ws_uld = wb.create_sheet("uld")
        ws_mawb = wb.create_sheet("mawb")

        ws_flight.append(FLIGHT_HEADERS)
        ws_uld.append(ULD_HEADERS)
        ws_mawb.append(MAWB_HEADERS)

        def _append_rows(ws, headers: list[str], rows: list):
            for row in rows:
                if not isinstance(row, dict):
                    continue
                ws.append([row.get(header) for header in headers])

        _append_rows(ws_flight, FLIGHT_HEADERS, flight_rows)
        _append_rows(ws_uld, ULD_HEADERS, uld_rows)
        _append_rows(ws_mawb, MAWB_HEADERS, mawb_rows)

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer.getvalue(), "manifest_form.xlsx"

    @staticmethod
    def upload_manifest(  # noqa: PLR0912, PLR0915
        file: UploadFile | None, db: Session, payload_json: str | None = None
    ) -> dict:
        filename = ""
        contents = b""
        if file is not None:
            filename = file.filename or ""
            if not filename.lower().endswith(ALLOWED_EXTENSIONS):
                raise HTTPException(
                    status_code=400,
                    detail="Format file tidak valid, gunakan Excel (.xlsx / .xlsm).",
                )
            contents = file.file.read()
        elif payload_json:
            contents, filename = BuildupService._build_workbook_from_payload(payload_json)
        else:
            raise HTTPException(
                status_code=400,
                detail="File Excel atau payload_json wajib diisi.",
            )

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        safe_name = _sanitize_filename(filename, default_stem="manifest")
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix
        max_stem_len = 43 - (len(timestamp) + 1 + len(suffix))
        if max_stem_len < 1:
            max_stem_len = 1
        stored_name = f"{stem[:max_stem_len]}_{timestamp}{suffix}"
        excel_path = EXCEL_DIR / stored_name
        EXCEL_DIR.mkdir(parents=True, exist_ok=True)
        try:
            excel_path.write_bytes(contents)
        except OSError as exc:
            logger.exception("Gagal menyimpan file Excel manifest.")
            raise HTTPException(
                status_code=500, detail="Gagal menyimpan file Excel manifest."
            ) from exc

        source_document_link = f"/excel/{stored_name}"
        wb = load_workbook(filename=BytesIO(contents), data_only=True)

        if "flight_manifest" not in wb.sheetnames:
            raise HTTPException(status_code=400, detail="Sheet flight_manifest tidak ditemukan.")
        if "uld" not in wb.sheetnames:
            raise HTTPException(status_code=400, detail="Sheet uld tidak ditemukan.")
        if "mawb" not in wb.sheetnames:
            raise HTTPException(status_code=400, detail="Sheet mawb tidak ditemukan.")

        ws_flight = wb["flight_manifest"]
        ws_uld = wb["uld"]
        ws_mawb = wb["mawb"]

        _read_headers(ws_flight, FLIGHT_HEADERS, "flight_manifest")
        _read_headers(ws_uld, ULD_HEADERS, "uld")
        mawb_headers = _read_headers_any(
            ws_mawb, [MAWB_HEADERS, MAWB_HEADERS_LEGACY], "mawb"
        )

        flight_entries: dict[tuple[str, date], dict] = {}
        uld_entries: dict[tuple[str, date, str, str], dict] = {}

        for idx, row in enumerate(ws_flight.iter_rows(min_row=2, values_only=True), start=2):
            if not _row_has_values(row):
                continue
            values = dict(
                zip(FLIGHT_HEADERS, list(row) + [None] * len(FLIGHT_HEADERS), strict=False)
            )

            airline_code = _normalize_identifier(values.get("airline_code"))
            flight_number = _normalize_identifier(values.get("flight_number"))
            flight_date = _parse_date(values.get("flight_date"), "flight_date", idx)
            point_of_loading = _normalize_identifier(values.get("point_of_loading"))
            point_of_unloading = _normalize_identifier(values.get("point_of_unloading"))

            if not all([airline_code, flight_number, point_of_loading, point_of_unloading]):
                raise HTTPException(
                    status_code=400, detail=f"Data flight tidak lengkap di baris {idx}."
                )

            flight_key = (flight_number, flight_date)
            if flight_key in flight_entries:
                raise HTTPException(status_code=400, detail=f"Flight duplikat di baris {idx}.")

            total_pieces = _to_int(values.get("total_pieces"), "total_pieces", idx)
            total_weight = _to_decimal(values.get("total_weight_kg"), "total_weight_kg", idx)
            source_document = source_document_link

            flight_obj = ExpManifestFligt(
                airline_code=airline_code,
                flight_number=flight_number,
                flight_date=flight_date,
                aircraft_registration=_normalize_identifier(values.get("aircraft_registration")),
                point_of_loading=point_of_loading,
                point_of_unloading=point_of_unloading,
                total_pieces=total_pieces,
                total_weight_kg=total_weight,
                source_document=source_document,
                raw_text=_normalize_identifier(values.get("raw_text")),
            )

            flight_entries[flight_key] = {
                "obj": flight_obj,
                "payload": {
                    "airline_code": airline_code,
                    "flight_number": flight_number,
                    "flight_date": flight_date.strftime("%Y-%m-%d"),
                    "aircraft_registration": _normalize_identifier(
                        values.get("aircraft_registration")
                    ),
                    "point_of_loading": point_of_loading,
                    "point_of_unloading": point_of_unloading,
                    "total_pieces": total_pieces,
                    "total_weight_kg": _format_decimal(total_weight),
                    "source_document": source_document,
                    "raw_text": _normalize_identifier(values.get("raw_text")),
                    "ulds": [],
                },
            }

        if not flight_entries:
            raise HTTPException(status_code=400, detail="Sheet flight_manifest kosong.")

        for idx, row in enumerate(ws_uld.iter_rows(min_row=2, values_only=True), start=2):
            if not _row_has_values(row):
                continue
            values = dict(zip(ULD_HEADERS, list(row) + [None] * len(ULD_HEADERS), strict=False))

            flight_number = _normalize_identifier(values.get("flight_number"))
            flight_date = _parse_date(values.get("flight_date"), "flight_date", idx)
            uld_type = _normalize_identifier(values.get("uld_type"))
            uld_number = _normalize_identifier(values.get("uld_number"))
            destination = _normalize_identifier(values.get("destination"))

            if not all([flight_number, uld_type, uld_number, destination]):
                raise HTTPException(
                    status_code=400, detail=f"Data ULD tidak lengkap di baris {idx}."
                )

            flight_key = (flight_number, flight_date)
            flight_entry = flight_entries.get(flight_key)
            if not flight_entry:
                raise HTTPException(
                    status_code=400,
                    detail=f"Flight tidak ditemukan untuk ULD di baris {idx}.",
                )

            uld_key = (flight_number, flight_date, uld_type, uld_number)
            if uld_key in uld_entries:
                raise HTTPException(status_code=400, detail=f"ULD duplikat di baris {idx}.")

            uld_owner = _normalize_identifier(values.get("uld_owner")) or "FX"
            remarks = _normalize_identifier(values.get("remarks"))

            uld_obj = ExpManifestUld(
                flight=flight_entry["obj"],
                uld_type=uld_type,
                uld_number=uld_number,
                uld_owner=uld_owner,
                destination=destination,
                remarks=remarks,
            )

            uld_payload = {
                "uld_type": uld_type,
                "uld_number": uld_number,
                "uld_owner": uld_owner,
                "destination": destination,
                "remarks": remarks,
                "mawbs": [],
            }

            flight_entry["payload"]["ulds"].append(uld_payload)
            uld_entries[uld_key] = {"obj": uld_obj, "payload": uld_payload}

        mawb_candidates: list[dict] = []
        seen_mawb_keys: set[tuple[str, str]] = set()
        duplicate_mawb_keys: set[tuple[str, str]] = set()

        for idx, row in enumerate(ws_mawb.iter_rows(min_row=2, values_only=True), start=2):
            if not _row_has_values(row):
                continue
            values = dict(
                zip(mawb_headers, list(row) + [None] * len(mawb_headers), strict=False)
            )

            flight_number = _normalize_identifier(values.get("flight_number"))
            flight_date = _parse_date(values.get("flight_date"), "flight_date", idx)
            uld_type = _normalize_identifier(values.get("uld_type"))
            uld_number = _normalize_identifier(values.get("uld_number"))
            mawb_prefix = _normalize_identifier(values.get("mawb_prefix"), pad=3)
            mawb_number = _normalize_identifier(values.get("mawb_number"))

            if not all([flight_number, uld_type, uld_number, mawb_prefix, mawb_number]):
                raise HTTPException(
                    status_code=400, detail=f"Data MAWB tidak lengkap di baris {idx}."
                )

            uld_key = (flight_number, flight_date, uld_type, uld_number)
            uld_entry = uld_entries.get(uld_key)
            if not uld_entry:
                raise HTTPException(
                    status_code=400,
                    detail=f"ULD tidak ditemukan untuk MAWB di baris {idx}.",
                )

            pieces = _to_int(values.get("pieces"), "pieces", idx)
            total_pieces = _to_int(
                values.get("total_pieces"), "total_pieces", idx, default=pieces
            )
            weight = _to_decimal(values.get("weight_kg"), "weight_kg", idx)
            transit_flag = _to_bool(values.get("transit_flag"))
            mawb_payload = {
                "mawb_prefix": mawb_prefix,
                "mawb_number": mawb_number,
                "pieces": pieces,
                "total_pieces": total_pieces,
                "weight_kg": _format_decimal(weight),
                "nature_of_goods": _normalize_identifier(values.get("nature_of_goods")),
                "route": _normalize_identifier(values.get("route")),
                "transit_flag": "Yes" if transit_flag else "No",
            }
            uld_entry["payload"]["mawbs"].append(mawb_payload)

            mawb_key = (mawb_prefix, mawb_number)
            if mawb_key in seen_mawb_keys:
                duplicate_mawb_keys.add(mawb_key)
                continue
            seen_mawb_keys.add(mawb_key)
            mawb_candidates.append(
                {
                    "key": mawb_key,
                    "uld_entry": uld_entry,
                    "pieces": pieces,
                    "total_pieces": total_pieces,
                    "weight": weight,
                    "nature_of_goods": _normalize_identifier(values.get("nature_of_goods")),
                    "route": _normalize_identifier(values.get("route")),
                    "transit_flag": transit_flag,
                }
            )

        existing_mawb_keys: set[tuple[str, str]] = set()
        if mawb_candidates:
            candidate_keys = {candidate["key"] for candidate in mawb_candidates}
            existing_rows = (
                db.query(ExpManifestMawb.mawb_prefix, ExpManifestMawb.mawb_number)
                .filter(
                    tuple_(ExpManifestMawb.mawb_prefix, ExpManifestMawb.mawb_number).in_(
                        candidate_keys
                    )
                )
                .all()
            )
            existing_mawb_keys = set(existing_rows)

        inserted_mawb_count = 0
        skipped_existing_count = 0
        for candidate in mawb_candidates:
            mawb_key = candidate["key"]
            if mawb_key in existing_mawb_keys:
                skipped_existing_count += 1
                continue

            mawb_obj = ExpManifestMawb(
                uld=candidate["uld_entry"]["obj"],
                mawb_prefix=mawb_key[0],
                mawb_number=mawb_key[1],
                pieces=candidate["pieces"],
                total_pieces=candidate["total_pieces"],
                weight_kg=candidate["weight"],
                nature_of_goods=candidate["nature_of_goods"],
                route=candidate["route"],
                transit_flag=candidate["transit_flag"],
            )
            db.add(mawb_obj)
            inserted_mawb_count += 1

        flights_payload = []
        for entry in flight_entries.values():
            payload = entry["payload"]
            rows = []
            for uld in payload["ulds"]:
                if uld["mawbs"]:
                    for mawb in uld["mawbs"]:
                        rows.append(
                            {
                                "uld_type": uld["uld_type"],
                                "uld_number": uld["uld_number"],
                                "uld_owner": uld["uld_owner"],
                                "destination": uld["destination"],
                                "remarks": uld["remarks"],
                                **mawb,
                            }
                        )
                else:
                    rows.append(
                        {
                            "uld_type": uld["uld_type"],
                            "uld_number": uld["uld_number"],
                            "uld_owner": uld["uld_owner"],
                            "destination": uld["destination"],
                            "remarks": uld["remarks"],
                            "mawb_prefix": "",
                            "mawb_number": "",
                            "pieces": "",
                            "total_pieces": "",
                            "weight_kg": "",
                            "nature_of_goods": "",
                            "route": "",
                            "transit_flag": "",
                        }
                    )
            payload["rows"] = rows
            payload["uld_count"] = len(payload["ulds"])
            payload["mawb_count"] = sum(len(uld["mawbs"]) for uld in payload["ulds"])
            flights_payload.append(payload)

        pdf_bytes = BuildupService._generate_pdf(flights_payload)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        flight_tag = flights_payload[0].get("flight_number") if flights_payload else "manifest"
        flight_tag = "".join(ch for ch in str(flight_tag) if ch.isalnum() or ch in ("-", "_"))
        if not flight_tag:
            flight_tag = "manifest"
        pdf_filename = f"fedex_manifest_{flight_tag}_{timestamp}.pdf"
        pdf_path = Path(PDF_DIR) / pdf_filename
        pdf_url = f"/pdf/{pdf_filename}"

        try:
            PDF_DIR.mkdir(parents=True, exist_ok=True)
            pdf_path.write_bytes(pdf_bytes)

            for entry in flight_entries.values():
                entry["obj"].raw_text = pdf_url
            for entry in flight_entries.values():
                db.add(entry["obj"])
            for entry in uld_entries.values():
                db.add(entry["obj"])
            db.flush()
            for entry in flight_entries.values():
                flight_obj = entry["obj"]
                db.add(
                    ExpManifestSummary(
                        flight_id=flight_obj.id,
                        total_pieces=flight_obj.total_pieces,
                        total_weight_kg=flight_obj.total_weight_kg,
                    )
                )
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if pdf_path.exists():
                try:
                    pdf_path.unlink()
                except OSError:
                    logger.warning("Gagal menghapus file PDF yang sudah dibuat: %s", pdf_path)

            logger.exception("Gagal menyimpan data manifest Fedex", exc_info=exc)
            raise HTTPException(status_code=500, detail="Gagal menyimpan data manifest.") from exc
        except Exception as exc:
            db.rollback()
            if pdf_path.exists():
                try:
                    pdf_path.unlink()
                except OSError:
                    logger.warning("Gagal menghapus file PDF yang sudah dibuat: %s", pdf_path)
            logger.exception("Gagal menyimpan data manifest Fedex", exc_info=exc)
            raise HTTPException(status_code=500, detail="Gagal menyimpan data manifest.") from exc

        message = "Upload manifest Fedex berhasil."
        skipped_duplicate_count = len(duplicate_mawb_keys)
        if skipped_duplicate_count or skipped_existing_count:
            parts = []
            if skipped_duplicate_count:
                parts.append(f"{skipped_duplicate_count} MAWB duplikat di file dilewati")
            if skipped_existing_count:
                parts.append(f"{skipped_existing_count} MAWB sudah ada di database")
            message = f"Upload manifest Fedex berhasil ({', '.join(parts)})."

        return {
            "message": message,
            "flight_count": len(flight_entries),
            "uld_count": sum(len(entry["payload"]["ulds"]) for entry in flight_entries.values()),
            "mawb_count": sum(
                sum(len(uld["mawbs"]) for uld in entry["payload"]["ulds"])
                for entry in flight_entries.values()
            ),
            "mawb_inserted_count": inserted_mawb_count,
            "mawb_skipped_duplicate_count": skipped_duplicate_count,
            "mawb_skipped_existing_count": skipped_existing_count,
            "pdf_url": pdf_url,
            "pdf_filename": pdf_filename,
        }

    # Bikin pdf disini
    @staticmethod
    def _generate_pdf(flights: list[dict]) -> bytes:
        templates_dir = Path(__file__).resolve().parent.parent / "templates"
        env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

        try:
            template = env.get_template("fedex_manifest.html")
            html_content = template.render(
                flights=flights,
                generated_at=datetime.now(timezone.utc),
                total_flights=len(flights),
            )
            pdf_buffer = BytesIO()
            pdf_result = pisa.CreatePDF(
                src=html_content,
                dest=pdf_buffer,
                encoding="utf-8",
            )
        except Exception as exc:
            logger.exception("Gagal menghasilkan PDF manifest Fedex.")
            raise HTTPException(status_code=500, detail="Gagal membuat PDF manifest.") from exc

        if pdf_result.err:
            logger.error("xhtml2pdf gagal menghasilkan output PDF manifest.")
            raise HTTPException(status_code=500, detail="Gagal memproses file PDF manifest.")

        pdf_buffer.seek(0)
        pdf_bytes = pdf_buffer.getvalue()
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="File PDF manifest kosong.")
        return pdf_bytes
