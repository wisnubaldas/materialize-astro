import re
from pathlib import Path

from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration

from app.repositories.build_up_check_repository import BuildUpCheckRepository
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckDetailOut,
    BuildUpCheckHeaderCreate,
    BuildUpCheckHeaderOut,
    BuildUpCheckHeaderReopen,
    BuildUpCheckRincianCreate,
    BuildUpCheckRincianOut,
    BuildUpMasterAwbSummaryOut,
    BuildUpPdfPrepareOut,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse


def _clean_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: object) -> str:
    return _clean_text(value).upper()


def _sum_rincian_pieces(items: list) -> int:
    total = 0
    for item in items:
        try:
            total += int(item.pieces or 0)
        except (TypeError, ValueError):
            continue
    return total


def _format_rincian_cell(pieces: object, weight: object) -> str:
    """Format one checklist rincian cell as pieces/weight.

    Args:
        pieces: Rincian pieces value.
        weight: Rincian weight value.

    Returns:
        Compact pieces/weight text for the PDF checklist grid.
    """
    try:
        pieces_value = int(pieces or 0)
    except (TypeError, ValueError):
        pieces_value = 0

    try:
        weight_value = float(weight or 0)
    except (TypeError, ValueError):
        weight_value = 0.0

    if weight_value.is_integer():
        weight_text = str(int(weight_value))
    else:
        weight_text = f"{weight_value:.2f}".rstrip("0").rstrip(".")
    return f"{pieces_value}/{weight_text}"


def _build_split_group_key(
    mawb: str | None, flight_no: str | None, flight_date: object
) -> str | None:
    """Build a stable key for MAWB split checks within the same flight."""
    if not mawb or not flight_no or not flight_date:
        return None
    return f"{_upper(flight_no)}|{flight_date}|{_upper(mawb)}"


def _parse_uld(uld_str: str) -> tuple[str, str, str]:
    """Parse ULD string (e.g. AKE12345FX) into (uld_type, uld_number, uld_owner)."""
    if not uld_str:
        return "", "", ""
    uld_str = uld_str.strip().upper()
    match = re.match(r"^([A-Z]{3})(\d{4,5})([A-Z0-9]{2})$", uld_str)
    if match:
        return match.group(1), match.group(2), match.group(3)

    match_partial = re.match(r"^([A-Z]{3})(\d+)(.*)$", uld_str)
    if match_partial:
        return match_partial.group(1), match_partial.group(2), match_partial.group(3)

    return uld_str, "", ""


def _display_flight_number(airline_code: object, flight_no: object) -> str:
    """Return flight number without duplicated airline prefix for printed forms."""
    airline = _upper(airline_code)
    flight = _upper(flight_no)
    if airline and flight.startswith(airline):
        return flight[len(airline) :]
    return flight


def _split_mawb(mawb: object) -> tuple[str, str]:
    mawb_str = _clean_text(mawb)
    if "-" in mawb_str:
        parts = mawb_str.split("-", 1)
        return parts[0], parts[1]
    if len(mawb_str) > 3:
        return mawb_str[:3], mawb_str[3:]
    return "", mawb_str


def _safe_pdf_filename(value: object) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", _clean_text(value))
    cleaned = cleaned.strip(".-")
    return cleaned or "build-up"


class BuildUpCheckService:
    """Business rules for mobile Build Up Check flow."""

    def __init__(self, repository: BuildUpCheckRepository):
        self.repository = repository

    @staticmethod
    def _map_detail(row, master_completed_pieces: int | None = None) -> BuildUpCheckDetailOut:
        completed_pieces = _sum_rincian_pieces(list(row.rincian or []))
        master_total_pieces = int(row.master_total_pieces or row.total_pieces or 0)
        allocation_limit = int(row.total_pieces or master_total_pieces or 0)
        remaining_pieces = max(allocation_limit - completed_pieces, 0)
        resolved_master_completed_pieces = (
            int(master_completed_pieces)
            if master_completed_pieces is not None
            else completed_pieces
        )
        master_remaining_pieces = max(master_total_pieces - resolved_master_completed_pieces, 0)
        is_completed = (
            bool(row.is_allocation_final)
            or (allocation_limit > 0 and remaining_pieces == 0)
            or (master_total_pieces > 0 and master_remaining_pieces == 0)
        )
        return BuildUpCheckDetailOut(
            id=row.id,
            header_id=row.header_id,
            mawb=row.mawb,
            total_pieces=row.total_pieces,
            master_total_pieces=row.master_total_pieces,
            split_group_key=row.split_group_key,
            split_sequence=row.split_sequence,
            split_total_uld=int(row.split_total_uld or 1),
            is_split_uld=bool(row.is_split_uld),
            is_allocation_final=bool(row.is_allocation_final),
            allocation_closed_at=row.allocation_closed_at,
            status=1 if is_completed else 0,
            agent=row.agent,
            remark=row.remark,
            completed_pieces=completed_pieces,
            remaining_pieces=remaining_pieces,
            master_completed_pieces=resolved_master_completed_pieces,
            master_remaining_pieces=master_remaining_pieces,
            is_completed=is_completed,
            rincian=[BuildUpCheckRincianOut.model_validate(item) for item in row.rincian],
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @classmethod
    def _map_header(cls, row) -> BuildUpCheckHeaderOut:
        details = list(row.details or [])
        mapped_details = [cls._map_detail(detail) for detail in details]
        total_pieces = sum(int(detail.total_pieces or 0) for detail in mapped_details)
        completed_pieces = sum(detail.completed_pieces for detail in mapped_details)
        is_completed = bool(mapped_details) and all(
            detail.is_completed for detail in mapped_details
        )
        return BuildUpCheckHeaderOut(
            id=row.id,
            uld=row.uld,
            airlines=row.airlines,
            flight_no=row.flight_no,
            dest=row.dest,
            flight_date=row.flight_date,
            staff=row.staff,
            supervisor=row.supervisor,
            total_pieces=total_pieces,
            completed_pieces=completed_pieces,
            is_completed=is_completed,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def list_headers(
        self,
        flight_date: str | None = None,
        unfinished_only: bool = False,
        completed_only: bool = False,
    ) -> list[BuildUpCheckHeaderOut]:
        """Return Build Up check headers with completion status."""
        rows = self.repository.list_headers(flight_date=flight_date)
        mapped_rows = [self._map_header(row) for row in rows]
        if completed_only:
            return [row for row in mapped_rows if row.is_completed]
        if unfinished_only:
            return [row for row in mapped_rows if not row.is_completed]
        return mapped_rows

    def build_up_headers_datatable(
        self,
        params: DataTablesParams,
    ) -> DataTablesResponse[BuildUpCheckHeaderOut]:
        """Return a DataTables response with mapped BuildUpCheckHeaderOut objects.

        Args:
            params: The DataTables parameters containing filters and pagination.

        Returns:
            A DataTables response object containing the header data.
        """
        total_records, filtered_records, results = self.repository.datatable(params)
        mapped_data = [self._map_header(row) for row in results]
        return DataTablesResponse[BuildUpCheckHeaderOut](
            draw=params.draw,
            recordsTotal=total_records,
            recordsFiltered=filtered_records,
            data=mapped_data,
        )

    @staticmethod
    def _build_mawbs_data(header) -> list[dict]:
        mawbs_data = []
        for detail in header.details:
            completed_pieces = sum(int(r.pieces or 0) for r in detail.rincian)
            completed_weight = sum(float(r.weight or 0.0) for r in detail.rincian)
            mawb_prefix, mawb_number = _split_mawb(detail.mawb)

            mawbs_data.append(
                {
                    "mawb_prefix": mawb_prefix,
                    "mawb_number": mawb_number,
                    "pieces": completed_pieces,
                    "total_pieces": detail.total_pieces or detail.master_total_pieces or 0,
                    "nature_of_goods": "GENERAL CARGO",
                    "weight_kg": completed_weight,
                    "route": "",
                    "transit_flag": "",
                    "agent": detail.agent or "",
                    "remark": detail.remark or "",
                    "rincian": [
                        _format_rincian_cell(rincian.pieces, rincian.weight)
                        for rincian in list(detail.rincian or [])
                    ],
                }
            )
        return mawbs_data

    @staticmethod
    def _build_manifest_dict(headers: list) -> dict:
        header = headers[0]
        ulds = []
        for item in headers:
            uld_type, uld_number, uld_owner = _parse_uld(item.uld)
            ulds.append(
                {
                    "uld_type": uld_type,
                    "uld_number": uld_number,
                    "uld_owner": uld_owner,
                    "destination": item.dest or "",
                    "remarks": "",
                    "mawbs": BuildUpCheckService._build_mawbs_data(item),
                }
            )

        return {
            "airline_code": header.airlines or "",
            "flight_number": _display_flight_number(header.airlines, header.flight_no),
            "flight_date": header.flight_date.strftime("%d-%b-%Y").upper()
            if header.flight_date
            else "",
            "aircraft_registration": "-",
            "point_of_unloading": header.dest or "",
            "point_of_loading": "CGK",
            "staff": header.staff or "",
            "supervisor": header.supervisor or "",
            "ulds": ulds,
        }

    @staticmethod
    def _render_build_up_pdf(manifest_dict: dict, is_checklist: bool) -> bytes:
        templates_dir = Path(__file__).resolve().parent.parent / "templates"
        env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

        try:
            if is_checklist:
                template = env.get_template("build_up_checklist_pdf.html")
            else:
                template = env.get_template("build_up_manifest_pdf.html")

            html_content = template.render(
                manifest=manifest_dict,
                is_checklist=is_checklist,
            )

            font_config = FontConfiguration()
            pdf_bytes = HTML(string=html_content, base_url=str(templates_dir)).write_pdf(
                font_config=font_config
            )
            return pdf_bytes
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"Gagal memproses pembuatan PDF Build Up: {exc!s}"
            ) from exc

    def generate_build_up_checklist_pdf(self, header_id: int) -> bytes:
        """Generate checklist PDF for one ULD Build Up header."""
        header = self.repository.get_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        return self._render_build_up_pdf(
            self._build_manifest_dict([header]),
            is_checklist=True,
        )

    def generate_build_up_manifest_pdf(self, header_id: int) -> bytes:
        """Generate manifest PDF for all ULDs in the same flight/date/destination."""
        seed_header = self.repository.get_header_by_id(header_id)
        if not seed_header:
            raise LookupError("Header build up check tidak ditemukan")

        grouped_headers = self.repository.list_headers_for_manifest(
            airlines=seed_header.airlines,
            flight_no=seed_header.flight_no,
            flight_date=seed_header.flight_date,
            dest=seed_header.dest,
        )
        if not grouped_headers:
            grouped_headers = [seed_header]

        return self._render_build_up_pdf(
            self._build_manifest_dict(grouped_headers),
            is_checklist=False,
        )

    def generate_build_up_pdf(self, header_id: int, is_checklist: bool) -> bytes:
        """Generate PDF for Build Up checklist or grouped manifest."""
        if is_checklist:
            return self.generate_build_up_checklist_pdf(header_id)
        return self.generate_build_up_manifest_pdf(header_id)

    @staticmethod
    def _prepared_pdf_dir() -> Path:
        return Path(__file__).resolve().parent.parent / "storage" / "generated_pdf" / "build_up"

    def _save_prepared_pdf(self, filename: str, pdf_bytes: bytes) -> Path:
        output_dir = self._prepared_pdf_dir()
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / filename
        output_path.write_bytes(pdf_bytes)
        return output_path

    def prepare_build_up_checklist_pdf(self, header_id: int) -> BuildUpPdfPrepareOut:
        """Generate checklist PDF in backend first and return its view path."""
        pdf_bytes = self.generate_build_up_checklist_pdf(header_id)
        filename = f"checklist-buildup-{header_id}.pdf"
        self._save_prepared_pdf(filename, pdf_bytes)
        return BuildUpPdfPrepareOut(
            filename=filename,
            pdf_path=f"/pdf/warehouse/generated/{filename}",
            message="PDF checklist siap ditampilkan.",
        )

    def prepare_build_up_manifest_pdf(self, header_id: int) -> BuildUpPdfPrepareOut:
        """Generate grouped manifest PDF in backend first and return its view path."""
        seed_header = self.repository.get_header_by_id(header_id)
        if not seed_header:
            raise LookupError("Header build up check tidak ditemukan")

        pdf_bytes = self.generate_build_up_manifest_pdf(header_id)
        flight_date = seed_header.flight_date.isoformat() if seed_header.flight_date else "nodate"
        identity = "-".join(
            [
                "manifest-buildup",
                seed_header.airlines or "airline",
                seed_header.flight_no or "flight",
                flight_date,
                seed_header.dest or "dest",
            ]
        )
        filename = f"{_safe_pdf_filename(identity)}.pdf"
        self._save_prepared_pdf(filename, pdf_bytes)
        return BuildUpPdfPrepareOut(
            filename=filename,
            pdf_path=f"/pdf/warehouse/generated/{filename}",
            message="PDF manifest siap ditampilkan.",
        )

    def get_prepared_pdf_path(self, filename: str) -> Path:
        """Resolve a generated PDF filename without allowing path traversal."""
        if Path(filename).name != filename or not filename.lower().endswith(".pdf"):
            raise LookupError("File PDF tidak valid")
        output_path = self._prepared_pdf_dir() / filename
        if not output_path.exists():
            raise LookupError("File PDF belum tersedia atau sudah dihapus")
        return output_path

    def get_master_awb_summary(self) -> BuildUpMasterAwbSummaryOut:
        """Return all-time Master AWB completion summary for dashboard cards."""
        summary = self.repository.get_master_awb_summary()
        return BuildUpMasterAwbSummaryOut(**summary)

    @staticmethod
    def _validate_master_total_pieces(payload: BuildUpCheckDetailCreate) -> None:
        """Ensure total pieces allocated to one ULD does not exceed MAWB total."""
        if payload.master_total_pieces is None and payload.total_pieces is None:
            raise ValueError("Total pieces MAWB wajib diisi.")
        if payload.master_total_pieces is None:
            return
        if payload.total_pieces is not None and int(payload.master_total_pieces) < int(
            payload.total_pieces
        ):
            raise ValueError("Total pieces MAWB tidak boleh lebih kecil dari pieces ULD ini.")

    @staticmethod
    def _ensure_master_total_pieces(payload: BuildUpCheckDetailCreate) -> BuildUpCheckDetailCreate:
        """Use planned ULD pieces as MAWB total for legacy payloads."""
        if payload.master_total_pieces is not None:
            return payload
        return payload.model_copy(update={"master_total_pieces": payload.total_pieces})

    def _validate_same_master_total(self, header, payload: BuildUpCheckDetailCreate) -> None:
        """Ensure one MAWB keeps the same total pieces across all ULDs in one flight."""
        if payload.master_total_pieces is None:
            return

        related_details = self.repository.list_details_by_mawb_flight(
            mawb=payload.mawb,
            flight_no=header.flight_no,
            flight_date=header.flight_date,
        )
        expected_total = int(payload.master_total_pieces)
        for related_detail in related_details:
            existing_total = int(
                related_detail.master_total_pieces or related_detail.total_pieces or 0
            )
            if existing_total > 0 and existing_total != expected_total:
                raise ValueError(
                    "Total pieces MAWB harus sama di semua ULD untuk MAWB "
                    f"{payload.mawb}. Total yang sudah tercatat: {existing_total}."
                )

    def _validate_existing_master_totals(self, header, detail) -> None:
        """Reject operational input when existing split ULD totals are inconsistent."""
        related_details = self.repository.list_details_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        known_totals = {
            int(item.master_total_pieces or item.total_pieces or 0)
            for item in related_details
            if int(item.master_total_pieces or item.total_pieces or 0) > 0
        }
        if len(known_totals) > 1:
            sorted_totals = ", ".join(str(total) for total in sorted(known_totals))
            raise ValueError(
                "Total pieces MAWB tidak konsisten antar ULD. " f"Total tercatat: {sorted_totals}."
            )

    def _sync_split_metadata(self, detail) -> object:
        """Refresh split ULD flags for same MAWB on the same flight."""
        header = detail.header or self.repository.get_header_by_id(detail.header_id)
        if not header:
            return detail

        group_key = _build_split_group_key(detail.mawb, header.flight_no, header.flight_date)
        related_details = self.repository.list_details_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no,
            flight_date=header.flight_date,
        )
        if not related_details:
            related_details = [detail]

        updated_details = self.repository.update_split_metadata(
            details=related_details,
            group_key=group_key,
        )
        return next((item for item in updated_details if item.id == detail.id), detail)

    def create_header(self, payload: BuildUpCheckHeaderCreate) -> BuildUpCheckHeaderOut:
        """Create one Build Up check header."""
        row = self.repository.create_header(payload)
        return self._map_header(row)

    def list_details(self, header_id: int) -> list[BuildUpCheckDetailOut]:
        """Return Build Up check details for one header."""
        header = self.repository.get_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        rows = self.repository.list_details(header_id)
        mapped_rows = []
        for row in rows:
            master_completed = self.repository.sum_rincian_by_mawb_flight(
                mawb=row.mawb,
                flight_no=header.flight_no,
                flight_date=header.flight_date,
            )
            if master_completed == 0:
                master_completed = _sum_rincian_pieces(list(row.rincian or []))
            mapped_rows.append(self._map_detail(row, master_completed_pieces=master_completed))
        return mapped_rows

    def create_detail(
        self,
        header_id: int,
        payload: BuildUpCheckDetailCreate,
    ) -> BuildUpCheckDetailOut:
        """Create detail MAWB for one Build Up check header."""
        header = self.repository.get_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        if self._map_header(header).is_completed:
            raise ValueError(
                "Build Up sudah selesai. Gunakan menu buka kembali untuk menambah MAWB."
            )
        self._validate_master_total_pieces(payload)
        payload = self._ensure_master_total_pieces(payload)
        self._validate_same_master_total(header, payload)
        row = self.repository.create_detail(header_id=header_id, payload=payload)
        row = self._sync_split_metadata(row)
        master_completed = self.repository.sum_rincian_by_mawb_flight(
            mawb=row.mawb,
            flight_no=header.flight_no,
            flight_date=header.flight_date,
        )
        return self._map_detail(row, master_completed_pieces=master_completed)

    def create_rincian(
        self,
        detail_id: int,
        payload: BuildUpCheckRincianCreate,
    ) -> BuildUpCheckDetailOut:
        """Add rincian and prevent pieces from exceeding detail total."""
        detail = self.repository.get_detail_by_id(detail_id)
        if not detail:
            raise LookupError("Detail build up check tidak ditemukan")

        if detail.is_allocation_final:
            raise ValueError("Alokasi ULD untuk MAWB ini sudah ditutup.")

        header = detail.header or self.repository.get_header_by_id(detail.header_id)
        self._validate_existing_master_totals(header, detail)
        master_total_pieces = int(detail.master_total_pieces or detail.total_pieces or 0)
        if master_total_pieces <= 0:
            raise ValueError("Total pieces MAWB belum tersedia untuk detail ini.")

        current_master_completed = self.repository.sum_rincian_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if current_master_completed == 0:
            current_master_completed = _sum_rincian_pieces(list(detail.rincian or []))
        if current_master_completed >= master_total_pieces:
            raise ValueError(
                "Total pieces MAWB sudah terpenuhi di ULD lain "
                f"({current_master_completed}/{master_total_pieces})."
            )

        requested_pieces = int(payload.pieces)
        if current_master_completed + requested_pieces > master_total_pieces:
            raise ValueError(
                "Total pieces rincian melebihi total pieces MAWB "
                f"({current_master_completed + requested_pieces}/{master_total_pieces})."
            )

        self.repository.create_rincian(detail_id=detail_id, payload=payload)
        refreshed = self.repository.get_detail_by_id(detail_id)
        new_master_completed = self.repository.sum_rincian_by_mawb_flight(
            mawb=refreshed.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if new_master_completed == 0:
            new_master_completed = _sum_rincian_pieces(list(refreshed.rincian or []))

        new_status = 1 if new_master_completed >= master_total_pieces else 0
        refreshed = self.repository.update_detail_status(
            detail=refreshed,
            status=new_status,
        )
        return self._map_detail(refreshed, master_completed_pieces=new_master_completed)

    def close_detail_allocation(self, detail_id: int) -> BuildUpCheckDetailOut:
        """Close current ULD allocation using the actual entered pieces."""
        detail = self.repository.get_detail_by_id(detail_id)
        if not detail:
            raise LookupError("Detail build up check tidak ditemukan")
        if detail.is_allocation_final:
            return self._map_detail(detail)

        header = detail.header or self.repository.get_header_by_id(detail.header_id)
        self._validate_existing_master_totals(header, detail)
        completed_pieces = _sum_rincian_pieces(list(detail.rincian or []))
        master_completed = self.repository.sum_rincian_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if master_completed == 0:
            master_completed = completed_pieces
        master_total_pieces = int(detail.master_total_pieces or detail.total_pieces or 0)
        if (
            master_total_pieces > 0
            and master_completed >= master_total_pieces
            and completed_pieces <= 0
        ):
            raise ValueError("Total pieces MAWB sudah terpenuhi di ULD lain.")
        if completed_pieces <= 0:
            raise ValueError("Rincian pieces wajib diisi sebelum alokasi ULD ditutup.")

        closed = self.repository.close_detail_allocation(
            detail=detail,
            total_pieces=completed_pieces,
            status=1,
        )
        closed = self._sync_split_metadata(closed)
        return self._map_detail(closed, master_completed_pieces=master_completed)

    def reopen_header(
        self,
        header_id: int,
        payload: BuildUpCheckHeaderReopen,
    ) -> BuildUpCheckHeaderOut:
        """Reopen a completed Build Up check header by adding a new MAWB detail."""
        header = self.repository.get_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")

        current_header = self._map_header(header)
        if not current_header.is_completed:
            raise ValueError("Build Up belum selesai, tidak perlu dibuka kembali.")

        detail_payload = BuildUpCheckDetailCreate(**payload.model_dump())
        self._validate_master_total_pieces(detail_payload)
        detail_payload = self._ensure_master_total_pieces(detail_payload)
        self._validate_same_master_total(header, detail_payload)
        detail = self.repository.create_detail(
            header_id=header_id,
            payload=detail_payload,
        )
        self._sync_split_metadata(detail)
        reopened = self.repository.get_header_by_id(header_id)
        return self._map_header(reopened)

    def delete_header(self, header_id: int) -> bool:
        """Hapus header build up check beserta detail dan rinciannya berdasarkan ID.

        Args:
            header_id: ID dari header build up check yang ingin dihapus.

        Returns:
            True jika berhasil dihapus.

        Raises:
            LookupError: Jika header build up check tidak ditemukan.
        """
        header = self.repository.get_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")

        self.repository.delete_header(header)
        return True
