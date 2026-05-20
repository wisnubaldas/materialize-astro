import logging
import re
from dataclasses import dataclass
from datetime import date
from html import escape

from app.models.BaseDB1.build_up_detail import BuildUpDetail
from app.models.BaseDB1.build_up_header import BuildUpHeader
from app.repositories.warehouse_repositrory import WarehouseRepository
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckDetailOut,
    BuildUpCheckHeaderCreate,
    BuildUpCheckHeaderOut,
    BuildUpCheckHeaderReopen,
    BuildUpCheckRincianCreate,
    BuildUpCheckRincianOut,
    BuildUpMasterAwbSummaryOut,
)
from app.schemas.build_up_detail_schema import BuildUpDetailOut
from app.schemas.build_up_draft_schema import (
    BuildUpDraftCreate,
    BuildUpDraftOut,
    BuildUpDraftUpdate,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.schemas.ffm_preview_schema import FfmPreviewOut

logger = logging.getLogger("warehouse")


@dataclass(slots=True)
class _FfmHeaderContext:
    carrier: str
    flight_number: str
    flight_date: str
    origin: str
    destination: str


@dataclass(slots=True)
class _FfmDetailBuildContext:
    carrier: str
    origin: str
    destination: str
    missing_fields: list[str]
    warnings: list[str]
    last_uld_key: str | None = None


def _clean_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: object) -> str:
    return _clean_text(value).upper()


def _format_mawb(value: object) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", _clean_text(value))
    if not cleaned:
        return ""
    if len(cleaned) <= 3:
        return cleaned.upper()
    prefix = cleaned[:3]
    serial = cleaned[3:]
    return f"{prefix}-{serial}".upper()


def _sum_rincian_pieces(items: list) -> int:
    total = 0
    for item in items:
        try:
            total += int(item.pieces or 0)
        except (TypeError, ValueError):
            continue
    return total


def _build_split_group_key(mawb: str | None, flight_no: str | None, flight_date: object) -> str | None:
    """Build a stable key for MAWB split checks within the same flight."""
    if not mawb or not flight_no or not flight_date:
        return None
    return f"{_upper(flight_no)}|{flight_date}|{_upper(mawb)}"


def _format_number(
    value: object,
    fraction_digits: int = 1,
    keep_trailing_zero: bool = False,
) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return ""
    if number <= 0:
        return ""
    rendered = f"{number:.{fraction_digits}f}"
    if keep_trailing_zero:
        return rendered
    return rendered.rstrip("0").rstrip(".")


def _format_ffm_date(value: date | None) -> str:
    if not value:
        return ""
    return value.strftime("%d%b").upper()


def _format_volume(value: float | int | None) -> str:
    if value is None:
        return ""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return ""
    if number <= 0:
        return ""
    return f"{number:.2f}"


def _format_uld_identifier(
    uld_type: str | None,
    uld_number: str | None,
    carrier: str,
    row_index: int,
    warnings: list[str],
) -> str:
    type_token = re.sub(r"[^A-Za-z0-9]", "", _upper(uld_type))
    type_code = type_token[:3]
    if len(type_code) != 3:
        if type_token:
            warnings.append(f"details[{row_index}] ULD type tidak valid, ULD line dilewati.")
        return ""

    number_token = re.sub(r"[^A-Za-z0-9]", "", _upper(uld_number))
    digit_match = re.search(r"(\d+)", number_token)
    if not digit_match:
        warnings.append(f"details[{row_index}] ULD serial tidak ditemukan, ULD line dilewati.")
        return ""

    serial = digit_match.group(1)
    if len(serial) < 4:
        serial = serial.zfill(4)
        warnings.append(f"details[{row_index}] ULD serial dipad kiri menjadi {serial}.")
    elif len(serial) > 5:
        serial = serial[-5:]
        warnings.append(f"details[{row_index}] ULD serial dipotong ke 5 digit terakhir ({serial}).")

    owner_match = re.search(r"([A-Z]{2,3})$", number_token)
    owner_seed = (owner_match.group(1) if owner_match else "").upper()
    if len(owner_seed) < 2:
        fallback_seed = re.sub(r"[^A-Z]", "", (carrier or "XX").upper())
        owner_seed = f"{owner_seed}{fallback_seed}XX"
        warnings.append(
            f"details[{row_index}] ULD owner code tidak ada/invalid, fallback memakai carrier."
        )
    owner_code = owner_seed[:2]

    return f"{type_code}{serial}{owner_code}"


def _derive_flight_number(
    number_build_up: str | None, airline_code: str | None
) -> tuple[str, bool]:
    token = _upper(number_build_up)
    airline = _upper(airline_code)
    if not token:
        return "", False

    if airline:
        by_carrier = re.search(rf"{re.escape(airline)}(\d{{3,4}})", token)
        if by_carrier:
            return by_carrier.group(1), True

    generic = re.search(r"[A-Z]{2}(\d{3,4})", token)
    if generic:
        return generic.group(1), True

    return "", False


class WarehouseService:
    def __init__(self, repo: WarehouseRepository):
        self.repository = repo

    def manifest_flight_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[ExpManifestFlightOut]:
        return self.repository.manifest_flight_datatable(params)

    def manifest_flight_details(self, header_id: int) -> list[BuildUpDetailOut]:
        rows = self.repository.get_manifest_flight_details(header_id)
        return [BuildUpDetailOut.model_validate(row) for row in rows]

    def get_manifest_flight_by_id(self, header_id: int) -> BuildUpHeader | None:
        return self.repository.get_manifest_flight_by_id(header_id)

    def delete_manifest_flight(self, header_id: int) -> tuple[bool, str | None]:
        return self.repository.delete_manifest_flight(header_id)

    def list_build_up_drafts(self) -> list[BuildUpDraftOut]:
        rows = self.repository.list_build_up_drafts()
        return [BuildUpDraftOut.model_validate(row) for row in rows]

    def create_build_up_draft(self, payload: BuildUpDraftCreate) -> BuildUpDraftOut:
        draft = self.repository.create_build_up_draft(payload)
        return BuildUpDraftOut.model_validate(draft)

    def update_build_up_draft(
        self,
        draft_id: int,
        payload: BuildUpDraftUpdate,
    ) -> BuildUpDraftOut:
        draft = self.repository.get_build_up_draft_by_id(draft_id)
        if not draft:
            raise LookupError("Draft build up tidak ditemukan")
        updated = self.repository.update_build_up_draft(draft, payload)
        return BuildUpDraftOut.model_validate(updated)

    def delete_build_up_draft(self, draft_id: int) -> None:
        draft = self.repository.get_build_up_draft_by_id(draft_id)
        if not draft:
            raise LookupError("Draft build up tidak ditemukan")
        self.repository.delete_build_up_draft(draft)

    def generate_ffm_preview(self, header_id: int) -> FfmPreviewOut:
        header, details = self.repository.get_manifest_flight_with_details(header_id)
        if not header:
            raise LookupError("Data build up tidak ditemukan")

        missing_fields: list[str] = []
        warnings: list[str] = []
        header_context = self._build_ffm_header_context(header, missing_fields, warnings)

        if not details:
            missing_fields.append("details (build_up_detail)")

        ffm_detail_lines: list[str] = []
        detail_context = _FfmDetailBuildContext(
            carrier=header_context.carrier,
            origin=header_context.origin,
            destination=header_context.destination,
            missing_fields=missing_fields,
            warnings=warnings,
        )
        valid_detail_count = 0
        for index, row in enumerate(details, start=1):
            current_lines, row_valid = self._build_ffm_detail_lines(
                row=row,
                row_index=index,
                context=detail_context,
            )
            if current_lines:
                ffm_detail_lines.extend(current_lines)
            if row_valid:
                valid_detail_count += 1

        if valid_detail_count == 0:
            missing_fields.append("details[*] (tidak ada baris detail yang valid)")

        blocking_header = any(field.startswith("header.") for field in missing_fields)
        generated = bool(not blocking_header and valid_detail_count > 0)
        if not generated:
            return FfmPreviewOut(
                header_id=header_id,
                buildup_number=header.number_build_up,
                generated=False,
                cargo_imp=None,
                cargo_xml=None,
                missing_fields=missing_fields,
                warnings=warnings,
            )

        lines = [
            "FFM/8",
            (
                "1/"
                f"{header_context.carrier}{header_context.flight_number}/"
                f"{header_context.flight_date}/{header_context.origin}"
            ),
            header_context.destination,
            *ffm_detail_lines,
            "LAST",
        ]
        cargo_imp = "\n".join(lines)
        cargo_xml = self._build_ffm_cargo_xml(
            header_id=header_id,
            buildup_number=header.number_build_up,
            header_context=header_context,
            details=details,
            cargo_imp=cargo_imp,
        )
        return FfmPreviewOut(
            header_id=header_id,
            buildup_number=header.number_build_up,
            generated=True,
            cargo_imp=cargo_imp,
            cargo_xml=cargo_xml,
            missing_fields=missing_fields,
            warnings=warnings,
        )

    @staticmethod
    def _build_ffm_cargo_xml(
        header_id: int,
        buildup_number: str | None,
        header_context: _FfmHeaderContext,
        details: list[BuildUpDetail],
        cargo_imp: str,
    ) -> str:
        """Build simple Cargo-XML preview for FFM modal."""
        lines = ['<XFFM version="1">']
        lines.append(
            '  <Manifest '
            + f'headerId="{header_id}" '
            + f'buildupNumber="{escape(_clean_text(buildup_number))}" '
            + f'carrier="{escape(header_context.carrier)}" '
            + f'flightNumber="{escape(header_context.flight_number)}" '
            + f'flightDate="{escape(header_context.flight_date)}" '
            + f'origin="{escape(header_context.origin)}" '
            + f'destination="{escape(header_context.destination)}"'
            + " />"
        )
        lines.append("  <Details>")
        for item in details:
            lines.append(
                "    <Shipment "
                + f'mawb="{escape(_clean_text(item.mawb))}" '
                + f'pieces="{escape(_clean_text(item.pieces))}" '
                + f'weight="{escape(_clean_text(item.weight))}" '
                + f'volume="{escape(_clean_text(item.volume))}" '
                + f'uldType="{escape(_clean_text(item.uld_type))}" '
                + f'uldNumber="{escape(_clean_text(item.uld_number))}"'
                + ">"
            )
            lines.append(f"      <NatureOfGoods>{escape(_clean_text(item.nature_of_goods))}</NatureOfGoods>")
            lines.append(f"      <Remark>{escape(_clean_text(item.remark))}</Remark>")
            lines.append("    </Shipment>")
        lines.append("  </Details>")
        lines.append("  <CargoIMP><![CDATA[")
        lines.append(cargo_imp)
        lines.append("]]></CargoIMP>")
        lines.append("</XFFM>")
        return "\n".join(lines)

    @staticmethod
    def _build_ffm_detail_lines(
        row: BuildUpDetail,
        row_index: int,
        context: _FfmDetailBuildContext,
    ) -> tuple[list[str], bool]:
        row_missing: list[str] = []
        lines: list[str] = []

        mawb = _format_mawb(row.mawb)
        if not mawb:
            row_missing.append(f"details[{row_index}].mawb")

        pieces = _format_number(row.pieces, 0)
        if not pieces:
            row_missing.append(f"details[{row_index}].pieces")

        weight = _format_number(row.weight, 1, keep_trailing_zero=True)
        if not weight:
            row_missing.append(f"details[{row_index}].weight")

        volume = _format_volume(row.volume)
        if not volume:
            row_missing.append(
                f"details[{row_index}].volume (MC) kosong, isi volume di form buildup."
            )

        if row_missing:
            context.missing_fields.extend(row_missing)
            context.warnings.append(f"Baris detail #{row_index} dilewati karena data belum lengkap.")
            return [], False

        uld_type = _upper(row.uld_type)
        uld_number = _upper(row.uld_number)
        if uld_type and uld_number:
            uld_key = f"{uld_type}|{uld_number}"
            if uld_key != context.last_uld_key:
                uld_identifier = _format_uld_identifier(
                    uld_type=uld_type,
                    uld_number=uld_number,
                    carrier=context.carrier,
                    row_index=row_index,
                    warnings=context.warnings,
                )
                if uld_identifier:
                    lines.append(f"ULD/{uld_identifier}")
            context.last_uld_key = uld_key
        elif uld_type or uld_number:
            context.warnings.append(
                f"details[{row_index}] ULD type/number tidak lengkap, ULD line dilewati."
            )

        goods = _upper(row.nature_of_goods) or "GENERAL CARGO"
        lines.append(
            f"{mawb}{context.origin}{context.destination}/T{pieces}K{weight}MC{volume}/{goods}"
        )
        return lines, True

    @staticmethod
    def _build_ffm_header_context(
        header: BuildUpHeader,
        missing_fields: list[str],
        warnings: list[str],
    ) -> _FfmHeaderContext:
        carrier = _upper(header.airlines_code)
        if not carrier:
            missing_fields.append("header.airlines_code")

        flight_number, derived_flight_no = _derive_flight_number(
            header.number_build_up,
            header.airlines_code,
        )
        if not flight_number:
            missing_fields.append("header.flight_number (tidak tersedia pada tabel build_up_header)")
        elif derived_flight_no:
            warnings.append("Flight number diturunkan dari pattern number_build_up.")

        flight_date = _format_ffm_date(header.flight_date)
        if not flight_date:
            missing_fields.append("header.flight_date")

        origin = _upper(header.origin)
        if not origin:
            missing_fields.append("header.origin")

        destination = _upper(header.dest)
        if not destination:
            missing_fields.append("header.dest")

        return _FfmHeaderContext(
            carrier=carrier,
            flight_number=flight_number,
            flight_date=flight_date,
            origin=origin,
            destination=destination,
        )

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def get_masterwaybills_by_awb(self, master_awbs: list[str]) -> list[ExportBuildupOut]:
        """Fetch build-up master rows for multiple MasterAWB values."""
        cleaned = [awb.strip() for awb in master_awbs if awb and awb.strip()]
        if not cleaned:
            raise ValueError("MasterAWB wajib diisi.")

        return self.repository.get_masterwaybill_by_awbs(cleaned)

    @staticmethod
    def _map_check_detail(row, master_completed_pieces: int | None = None) -> BuildUpCheckDetailOut:
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
        is_completed = bool(row.is_allocation_final) or (
            allocation_limit > 0 and remaining_pieces == 0
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
    def _map_check_header(cls, row) -> BuildUpCheckHeaderOut:
        details = list(row.details or [])
        mapped_details = [cls._map_check_detail(detail) for detail in details]
        total_pieces = sum(int(detail.total_pieces or 0) for detail in mapped_details)
        completed_pieces = sum(detail.completed_pieces for detail in mapped_details)
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
            is_completed=bool(details) and total_pieces > 0 and completed_pieces >= total_pieces,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def list_build_up_check_headers(
        self,
        flight_date: str | None = None,
        unfinished_only: bool = False,
        completed_only: bool = False,
    ) -> list[BuildUpCheckHeaderOut]:
        """Return Build Up check headers with completion status."""
        rows = self.repository.list_build_up_check_headers(
            flight_date=flight_date,
        )
        mapped_rows = [self._map_check_header(row) for row in rows]
        if completed_only:
            return [row for row in mapped_rows if row.is_completed]
        if unfinished_only:
            return [row for row in mapped_rows if not row.is_completed]
        return mapped_rows

    def get_build_up_master_awb_summary(self) -> BuildUpMasterAwbSummaryOut:
        """Return all-time Master AWB completion summary for dashboard cards."""
        summary = self.repository.get_build_up_master_awb_summary()
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

    def _sync_build_up_check_split_metadata(self, detail) -> object:
        """Refresh split ULD flags for same MAWB on the same flight."""
        header = detail.header or self.repository.get_build_up_check_header_by_id(detail.header_id)
        if not header:
            return detail

        group_key = _build_split_group_key(detail.mawb, header.flight_no, header.flight_date)
        related_details = self.repository.list_build_up_check_details_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no,
            flight_date=header.flight_date,
        )
        if not related_details:
            related_details = [detail]

        updated_details = self.repository.update_build_up_check_split_metadata(
            details=related_details,
            group_key=group_key,
        )
        return next((item for item in updated_details if item.id == detail.id), detail)

    def create_build_up_check_header(
        self,
        payload: BuildUpCheckHeaderCreate,
    ) -> BuildUpCheckHeaderOut:
        """Create one Build Up check header."""
        row = self.repository.create_build_up_check_header(payload)
        return self._map_check_header(row)

    def list_build_up_check_details(self, header_id: int) -> list[BuildUpCheckDetailOut]:
        """Return Build Up check details for one header."""
        header = self.repository.get_build_up_check_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        rows = self.repository.list_build_up_check_details(header_id)
        return [self._map_check_detail(row) for row in rows]

    def create_build_up_check_detail(
        self,
        header_id: int,
        payload: BuildUpCheckDetailCreate,
    ) -> BuildUpCheckDetailOut:
        """Create detail MAWB for one Build Up check header."""
        header = self.repository.get_build_up_check_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        self._validate_master_total_pieces(payload)
        payload = self._ensure_master_total_pieces(payload)
        row = self.repository.create_build_up_check_detail(header_id=header_id, payload=payload)
        row = self._sync_build_up_check_split_metadata(row)
        return self._map_check_detail(row)

    def create_build_up_check_rincian(
        self,
        detail_id: int,
        payload: BuildUpCheckRincianCreate,
    ) -> BuildUpCheckDetailOut:
        """Add rincian and prevent pieces from exceeding detail total."""
        detail = self.repository.get_build_up_check_detail_by_id(detail_id)
        if not detail:
            raise LookupError("Detail build up check tidak ditemukan")

        if detail.is_allocation_final:
            raise ValueError("Alokasi ULD untuk MAWB ini sudah ditutup.")

        header = detail.header or self.repository.get_build_up_check_header_by_id(detail.header_id)
        master_total_pieces = int(detail.master_total_pieces or detail.total_pieces or 0)
        if master_total_pieces <= 0:
            raise ValueError("Total pieces MAWB belum tersedia untuk detail ini.")

        current_master_completed = self.repository.sum_build_up_check_rincian_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if current_master_completed == 0:
            current_master_completed = _sum_rincian_pieces(list(detail.rincian or []))

        requested_pieces = int(payload.pieces)
        if current_master_completed + requested_pieces > master_total_pieces:
            raise ValueError(
                "Total pieces rincian melebihi total pieces MAWB "
                f"({current_master_completed + requested_pieces}/{master_total_pieces})."
            )

        self.repository.create_build_up_check_rincian(detail_id=detail_id, payload=payload)
        refreshed = self.repository.get_build_up_check_detail_by_id(detail_id)
        new_master_completed = self.repository.sum_build_up_check_rincian_by_mawb_flight(
            mawb=refreshed.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if new_master_completed == 0:
            new_master_completed = _sum_rincian_pieces(list(refreshed.rincian or []))

        new_status = 1 if new_master_completed >= master_total_pieces else 0
        refreshed = self.repository.update_build_up_check_detail_status(
            detail=refreshed,
            status=new_status,
        )
        return self._map_check_detail(refreshed, master_completed_pieces=new_master_completed)

    def close_build_up_check_detail_allocation(self, detail_id: int) -> BuildUpCheckDetailOut:
        """Close current ULD allocation using the actual entered pieces."""
        detail = self.repository.get_build_up_check_detail_by_id(detail_id)
        if not detail:
            raise LookupError("Detail build up check tidak ditemukan")
        if detail.is_allocation_final:
            return self._map_check_detail(detail)

        completed_pieces = _sum_rincian_pieces(list(detail.rincian or []))
        if completed_pieces <= 0:
            raise ValueError("Rincian pieces wajib diisi sebelum alokasi ULD ditutup.")

        header = detail.header or self.repository.get_build_up_check_header_by_id(detail.header_id)
        master_completed = self.repository.sum_build_up_check_rincian_by_mawb_flight(
            mawb=detail.mawb,
            flight_no=header.flight_no if header else None,
            flight_date=header.flight_date if header else None,
        )
        if master_completed == 0:
            master_completed = completed_pieces

        closed = self.repository.close_build_up_check_detail_allocation(
            detail=detail,
            total_pieces=completed_pieces,
            status=1,
        )
        closed = self._sync_build_up_check_split_metadata(closed)
        return self._map_check_detail(closed, master_completed_pieces=master_completed)

    def reopen_build_up_check_header(
        self,
        header_id: int,
        payload: BuildUpCheckHeaderReopen,
    ) -> BuildUpCheckHeaderOut:
        """Reopen a completed Build Up check header by adding a new MAWB detail."""
        header = self.repository.get_build_up_check_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")

        current_header = self._map_check_header(header)
        if not current_header.is_completed:
            raise ValueError("Build Up belum selesai, tidak perlu dibuka kembali.")

        detail_payload = BuildUpCheckDetailCreate(**payload.model_dump())
        self._validate_master_total_pieces(detail_payload)
        detail_payload = self._ensure_master_total_pieces(detail_payload)
        detail = self.repository.create_build_up_check_detail(
            header_id=header_id,
            payload=detail_payload,
        )
        self._sync_build_up_check_split_metadata(detail)
        reopened = self.repository.get_build_up_check_header_by_id(header_id)
        return self._map_check_header(reopened)
