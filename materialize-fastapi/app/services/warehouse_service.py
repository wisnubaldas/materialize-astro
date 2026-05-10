import logging
import re
from datetime import date

from app.models.BaseDB1.build_up_detail import BuildUpDetail
from app.models.BaseDB1.build_up_header import BuildUpHeader
from app.repositories.warehouse_repositrory import WarehouseRepository
from app.schemas.build_up_detail_schema import BuildUpDetailOut
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.schemas.ffm_preview_schema import FfmPreviewOut

logger = logging.getLogger("warehouse")


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


def _derive_flight_number(number_build_up: str | None, airline_code: str | None) -> tuple[str, bool]:
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

    def generate_ffm_preview(self, header_id: int) -> FfmPreviewOut:
        header, details = self.repository.get_manifest_flight_with_details(header_id)
        if not header:
            raise LookupError("Data build up tidak ditemukan")

        missing_fields: list[str] = []
        warnings: list[str] = []

        carrier = _upper(header.airlines_code)
        if not carrier:
            missing_fields.append("header.airlines_code")

        flight_number, derived_flight_no = _derive_flight_number(
            header.number_build_up,
            header.airlines_code,
        )
        if not flight_number:
            missing_fields.append(
                "header.flight_number (tidak tersedia pada tabel build_up_header)"
            )
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

        if not details:
            missing_fields.append("details (build_up_detail)")

        ffm_detail_lines: list[str] = []
        last_uld_key: str | None = None
        valid_detail_count = 0
        for index, row in enumerate(details, start=1):
            current_lines, row_valid = self._build_ffm_detail_lines(
                row=row,
                row_index=index,
                carrier=carrier,
                origin=origin,
                destination=destination,
                missing_fields=missing_fields,
                warnings=warnings,
                last_uld_key=last_uld_key,
            )
            if current_lines:
                ffm_detail_lines.extend(current_lines)
            if row_valid:
                valid_detail_count += 1
                uld_type = _upper(row.uld_type)
                uld_number = _upper(row.uld_number)
                if uld_type and uld_number:
                    last_uld_key = f"{uld_type}|{uld_number}"

        if valid_detail_count == 0:
            missing_fields.append("details[*] (tidak ada baris detail yang valid)")

        blocking_header = any(
            field.startswith("header.")
            for field in missing_fields
        )
        generated = bool(not blocking_header and valid_detail_count > 0)
        if not generated:
            return FfmPreviewOut(
                header_id=header_id,
                buildup_number=header.number_build_up,
                generated=False,
                cargo_imp=None,
                missing_fields=missing_fields,
                warnings=warnings,
            )

        lines = [
            "FFM/8",
            f"1/{carrier}{flight_number}/{flight_date}/{origin}",
            destination,
            *ffm_detail_lines,
            "LAST",
        ]
        return FfmPreviewOut(
            header_id=header_id,
            buildup_number=header.number_build_up,
            generated=True,
            cargo_imp="\n".join(lines),
            missing_fields=missing_fields,
            warnings=warnings,
        )

    @staticmethod
    def _build_ffm_detail_lines(
        row: BuildUpDetail,
        row_index: int,
        carrier: str,
        origin: str,
        destination: str,
        missing_fields: list[str],
        warnings: list[str],
        last_uld_key: str | None,
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
            missing_fields.extend(row_missing)
            warnings.append(f"Baris detail #{row_index} dilewati karena data belum lengkap.")
            return [], False

        uld_type = _upper(row.uld_type)
        uld_number = _upper(row.uld_number)
        if uld_type and uld_number:
            uld_key = f"{uld_type}|{uld_number}"
            if uld_key != last_uld_key:
                uld_identifier = _format_uld_identifier(
                    uld_type=uld_type,
                    uld_number=uld_number,
                    carrier=carrier,
                    row_index=row_index,
                    warnings=warnings,
                )
                if uld_identifier:
                    lines.append(f"ULD/{uld_identifier}")
        elif uld_type or uld_number:
            warnings.append(
                f"details[{row_index}] ULD type/number tidak lengkap, ULD line dilewati."
            )

        goods = _upper(row.nature_of_goods) or "GENERAL CARGO"
        lines.append(f"{mawb}{origin}{destination}/T{pieces}K{weight}MC{volume}/{goods}")
        return lines, True

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def get_masterwaybills_by_awb(
        self, master_awbs: list[str]
    ) -> list[ExportBuildupOut]:
        """Fetch build-up master rows for multiple MasterAWB values."""
        cleaned = [awb.strip() for awb in master_awbs if awb and awb.strip()]
        if not cleaned:
            raise ValueError("MasterAWB wajib diisi.")

        return self.repository.get_masterwaybill_by_awbs(cleaned)

