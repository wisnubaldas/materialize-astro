import logging
import re
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from types import SimpleNamespace
from typing import Any

from app.libs.fhl_message_builder import build_fhl_messages
from app.libs.fwb_message_builder import build_fwb_cargo_imp, build_fwb_cargo_xml
from app.repositories.edi_repository import EdiRepository
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.ffm_build_up_schema import FfmBuildUpDetailOut, FfmBuildUpOut
from app.schemas.ffm_preview_schema import FfmPreviewOut
from app.schemas.fhl_message_schema import FhlMessageOut
from app.schemas.fhl_schema import FhlResponse
from app.schemas.fwb_message_schema import FwbMessageOut
from app.schemas.fwb_schema import FwbResponse
from app.schemas.fwb_table_schema import FwbTableOut
from app.schemas.imp_hostawb import ImpHostAWBOut
from app.schemas.imp_masterwaybill import ImpMasterWaybillOut
from app.schemas.mst_customer_schema import CustomerOut
from app.schemas.weighing_detail_schema import WeighingDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.utils.jinja import jinja_env
from app.utils.mail_config import smtp_email_service

logger = logging.getLogger("edi")


def _clean_text(value: Any) -> str | None:
    """Normalize empty-like values to None and strip whitespace for storage."""
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_date(value: Any) -> date | None:
    """Parse ISO-like date values into date objects."""
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def _parse_datetime(value: Any) -> datetime | None:
    """Parse ISO-like datetime values into datetime objects."""
    parsed: datetime | None = None
    if value:
        if isinstance(value, datetime):
            parsed = value
        elif isinstance(value, date):
            parsed = datetime.combine(value, datetime.min.time())
        elif isinstance(value, str):
            for candidate in (value, value[:10]):
                try:
                    parsed = datetime.fromisoformat(candidate)
                    break
                except ValueError:
                    continue
    return parsed


def _parse_int(value: Any) -> int | None:
    """Parse integer-like values and normalize empty strings to None."""
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        value = text
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _parse_decimal(value: Any) -> Decimal | None:
    """Parse decimal-like values and normalize empty strings to None."""
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        value = text
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _sum_rincian_pieces(items: list) -> int | None:
    total = 0
    has_value = False
    for item in items:
        value = _parse_int(getattr(item, "pieces", None))
        if value is None:
            continue
        total += value
        has_value = True
    return total if has_value else None


def _sum_rincian_weight(items: list) -> float | None:
    total = Decimal("0")
    has_value = False
    for item in items:
        value = _parse_decimal(getattr(item, "weight", None))
        if value is None:
            continue
        total += value
        has_value = True
    return float(total) if has_value else None


def _first_text(*values: Any) -> str | None:
    for value in values:
        cleaned = _clean_text(value)
        if cleaned:
            return cleaned
    return None


def _first_int(*values: Any) -> int | None:
    for value in values:
        parsed = _parse_int(value)
        if parsed is not None:
            return parsed
    return None


def _first_float(*values: Any) -> float | None:
    for value in values:
        parsed = _parse_decimal(value)
        if parsed is not None:
            return float(parsed)
    return None


def _parse_uld(value: Any) -> dict[str, str | None]:
    text = re.sub(r"[^A-Za-z0-9]", "", _clean_text(value) or "").upper()
    if not text:
        return {"uld_type": None, "uld_number": None, "uld_owner": None}

    uld_type = text[:3] if len(text) >= 3 else text
    remainder = text[3:]
    owner_match = re.search(r"([A-Z]{2,3})$", remainder)
    uld_owner = owner_match.group(1)[:2] if owner_match else None
    number_part = remainder[: -len(owner_match.group(1))] if owner_match else remainder
    serial_match = re.search(r"\d{4,5}", number_part)
    uld_number = serial_match.group(0) if serial_match else number_part or None
    return {
        "uld_type": uld_type or None,
        "uld_number": uld_number,
        "uld_owner": uld_owner,
    }


def _calc_volume_from_dimensions(
    long_cm: Any,
    width_cm: Any,
    high_cm: Any,
) -> float | None:
    """
    Hitung volume (m³) dari dimensi panjang/lebar/tinggi dalam satuan cm.

    Digunakan sebagai fallback ketika kolom VolumeCargo di eks_weighingdetail kosong.
    Konversi: (cm x cm x cm) / 1_000_000 = m3

    Args:
        long_cm: Panjang dalam cm.
        width_cm: Lebar dalam cm.
        high_cm: Tinggi dalam cm.

    Returns:
        Volume dalam m³ sebagai float, atau None jika salah satu dimensi tidak tersedia.
    """
    p = _parse_decimal(long_cm)
    w = _parse_decimal(width_cm)
    h = _parse_decimal(high_cm)
    if p is None or w is None or h is None:
        return None
    if p <= 0 or w <= 0 or h <= 0:
        return None
    return float((p * w * h) / 1_000_000)


def _format_mawb_for_ffm(value: Any) -> str:
    text = re.sub(r"[^A-Za-z0-9]", "", _clean_text(value) or "").upper()
    if len(text) <= 3:
        return text
    return f"{text[:3]}-{text[3:]}"


def _format_ffm_number(value: Any, fraction_digits: int = 1) -> str:
    parsed = _parse_decimal(value)
    if parsed is None or parsed <= 0:
        return ""
    rendered = f"{float(parsed):.{fraction_digits}f}"
    return rendered.rstrip("0").rstrip(".")


def _format_ffm_date(value: Any) -> str:
    parsed = _parse_date(value)
    if parsed:
        return parsed.strftime("%d%b").upper()

    text = _clean_text(value)
    if not text:
        return ""
    for candidate in (text, text[:10], text[:8]):
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%Y%m%d"):
            try:
                return (
                    datetime.strptime(candidate, fmt)
                    .replace(tzinfo=timezone.utc)
                    .strftime("%d%b")
                    .upper()
                )
            except ValueError:
                continue
    return ""


def _format_uld_identifier(uld_info: dict[str, str | None], carrier: str | None) -> str:
    uld_type = re.sub(r"[^A-Z0-9]", "", (uld_info.get("uld_type") or "").upper())[:3]
    uld_number = re.sub(r"[^A-Z0-9]", "", (uld_info.get("uld_number") or "").upper())
    owner = re.sub(r"[^A-Z]", "", (uld_info.get("uld_owner") or "").upper())[:2]
    if not owner:
        owner = re.sub(r"[^A-Z]", "", (carrier or "XX").upper())[:2] or "XX"
    serial_match = re.search(r"\d{4,5}", uld_number)
    if len(uld_type) != 3 or not serial_match:
        return ""
    serial = serial_match.group(0)
    return f"{uld_type}{serial}{owner}"


def _extract_mawb(payload: Any) -> str | None:
    """Extract MAWB from FWB payload (prefers awb prefix/number)."""
    if not isinstance(payload, dict):
        return None
    fwb = payload.get("fwb") if isinstance(payload.get("fwb"), dict) else {}
    awb_prefix = _clean_text(fwb.get("awb_prefix"))
    awb_number = _clean_text(fwb.get("awb_number"))
    if awb_prefix and awb_number:
        return f"{awb_prefix}-{awb_number}"

    header = payload.get("header") if isinstance(payload.get("header"), dict) else {}
    master = payload.get("master") if isinstance(payload.get("master"), dict) else {}
    for source in (fwb, header, master):
        mawb = _clean_text(source.get("MasterAWB") or source.get("mawb"))
        if mawb:
            return mawb
    details = payload.get("details")
    if isinstance(details, list) and details:
        detail_mawb = _clean_text(details[0].get("MasterAWB")) if isinstance(details[0], dict) else None
        if detail_mawb:
            return detail_mawb
    return None


def _build_fwb_values(payload: dict[str, Any], raw_message: str | None) -> tuple[str, dict[str, Any]] | None:
    """Build normalized DB-like FWB value map from payload."""
    mawb = _extract_mawb(payload)
    if not mawb:
        return None

    fwb_payload = payload.get("fwb") if isinstance(payload.get("fwb"), dict) else {}
    issue_date = _parse_date(fwb_payload.get("issue_date"))
    flight_date = _parse_datetime(fwb_payload.get("flight_date"))

    values = {
        "mawb": mawb,
        "message_type": _clean_text(fwb_payload.get("message_type")),
        "message_version": _clean_text(fwb_payload.get("message_version")),
        "awb_prefix": _clean_text(fwb_payload.get("awb_prefix")),
        "awb_number": _clean_text(fwb_payload.get("awb_number")),
        "origin": _clean_text(fwb_payload.get("origin")),
        "destination": _clean_text(fwb_payload.get("destination")),
        "shipment_description_code": _clean_text(fwb_payload.get("shipment_description_code")),
        "total_pieces": _parse_int(fwb_payload.get("total_pieces")),
        "weight_unit": _clean_text(fwb_payload.get("weight_unit")),
        "gross_weight": _parse_decimal(fwb_payload.get("gross_weight")),
        "routing_list": _clean_text(fwb_payload.get("routing_list")),
        "first_carrier": _clean_text(fwb_payload.get("first_carrier")),
        "onward_carrier": _clean_text(fwb_payload.get("onward_carrier")),
        "flight_number": _clean_text(fwb_payload.get("flight_number")),
        "flight_carrier": _clean_text(fwb_payload.get("flight_carrier")),
        "shipper_name": _clean_text(fwb_payload.get("shipper_name")),
        "shipper_address": _clean_text(fwb_payload.get("shipper_address")),
        "shipper_city": _clean_text(fwb_payload.get("shipper_city")),
        "shipper_state": _clean_text(fwb_payload.get("shipper_state")),
        "shipper_country": _clean_text(fwb_payload.get("shipper_country")),
        "shipper_postcode": _clean_text(fwb_payload.get("shipper_postcode")),
        "shipper_contact": _clean_text(fwb_payload.get("shipper_contact")),
        "consignee_name": _clean_text(fwb_payload.get("consignee_name")),
        "consignee_address": _clean_text(fwb_payload.get("consignee_address")),
        "consignee_city": _clean_text(fwb_payload.get("consignee_city")),
        "consignee_state": _clean_text(fwb_payload.get("consignee_state")),
        "consignee_country": _clean_text(fwb_payload.get("consignee_country")),
        "consignee_postcode": _clean_text(fwb_payload.get("consignee_postcode")),
        "consignee_contact": _clean_text(fwb_payload.get("consignee_contact")),
        "agent_iata_code": _clean_text(fwb_payload.get("agent_iata_code")),
        "agent_account": _clean_text(fwb_payload.get("agent_account")),
        "agent_name": _clean_text(fwb_payload.get("agent_name")),
        "agent_city": _clean_text(fwb_payload.get("agent_city")),
        "currency": _clean_text(fwb_payload.get("currency")),
        "charge_code": _clean_text(fwb_payload.get("charge_code")),
        "weight_charge_pp_cc": _clean_text(fwb_payload.get("weight_charge_pp_cc")),
        "other_charge_pp_cc": _clean_text(fwb_payload.get("other_charge_pp_cc")),
        "declared_value_carriage": _clean_text(fwb_payload.get("declared_value_carriage")),
        "declared_value_customs": _clean_text(fwb_payload.get("declared_value_customs")),
        "insurance_value": _clean_text(fwb_payload.get("insurance_value")),
        "rate_line_no": _clean_text(fwb_payload.get("rate_line_no")),
        "pieces": _parse_int(fwb_payload.get("pieces") or fwb_payload.get("total_pieces")),
        "weight": _parse_decimal(fwb_payload.get("weight") or fwb_payload.get("gross_weight")),
        "rate_class": _clean_text(fwb_payload.get("rate_class")),
        "chargeable_weight": _parse_decimal(fwb_payload.get("chargeable_weight")),
        "rate": _parse_decimal(fwb_payload.get("rate")),
        "total_charge": _parse_decimal(fwb_payload.get("total_charge")),
        "goods_description": _clean_text(fwb_payload.get("goods_description")),
        "dimensions": _clean_text(fwb_payload.get("dimensions")),
        "volume": _parse_decimal(fwb_payload.get("volume")),
        "slac": _clean_text(fwb_payload.get("slac")),
        "hs_code": _clean_text(fwb_payload.get("hs_code")),
        "country_of_origin": _clean_text(fwb_payload.get("country_of_origin")),
        "other_charge_code": _clean_text(fwb_payload.get("other_charge_code")),
        "entitlement": _clean_text(fwb_payload.get("entitlement")),
        "amount": _parse_decimal(fwb_payload.get("amount")),
        "prepaid_weight_charge": _parse_decimal(fwb_payload.get("prepaid_weight_charge")),
        "prepaid_other_charge": _parse_decimal(fwb_payload.get("prepaid_other_charge")),
        "total_prepaid": _parse_decimal(fwb_payload.get("total_prepaid")),
        "collect_charge": _parse_decimal(fwb_payload.get("collect_charge")),
        "shipper_certification": _clean_text(fwb_payload.get("shipper_certification")),
        "issue_date": issue_date,
        "issue_place": _clean_text(fwb_payload.get("issue_place")),
        "issued_by": _clean_text(fwb_payload.get("issued_by")),
        "special_handling_code": _clean_text(fwb_payload.get("special_handling_code")),
        "ssr": _clean_text(fwb_payload.get("ssr")),
        "osi": _clean_text(fwb_payload.get("osi")),
        "oci": _clean_text(fwb_payload.get("oci")),
        "flight_date": flight_date,
        "routing": _clean_text(fwb_payload.get("routing_list")),
        "flight_no": _clean_text(fwb_payload.get("flight_number")),
        "raw_message": _clean_text(raw_message),
    }
    return mawb, values


class EdiService:
    def __init__(self, repo: EdiRepository):
        self.repository = repo


    def weighing_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[WeighingHeaderOut]:
        return self.repository.weighing_datatable(params)

    def masterwaybill_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def ffm_build_up_datatable(
        self,
        params: DataTablesParams,
    ) -> DataTablesResponse[FfmBuildUpOut]:
        """Return FFM rows from mobile Build Up Check tables."""
        total_records, filtered_records, rows = self.repository.list_ffm_build_up_headers(params)
        return DataTablesResponse(
            draw=params.draw,
            records_total=total_records,
            records_filtered=filtered_records,
            data=[self._map_ffm_header(row) for row in rows],
        )

    def ffm_build_up_details(self, header_id: int) -> list[FfmBuildUpDetailOut]:
        """Return FFM detail rows from Build Up Check with legacy fallback attributes."""
        header = self.repository.get_ffm_build_up_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")
        return [self._map_ffm_detail(header, detail) for detail in list(header.details or [])]

    def generate_ffm_build_up_preview(self, header_id: int) -> FfmPreviewOut:  # noqa: PLR0912, PLR0915
        """
        Generate FFM Cargo-IMP dan Cargo-XML dari Build Up Check + fallback legacy DB2 (SSoT).

        Chain fallback untuk setiap field:
        - carrier    : build_up_check_header.airlines → eks_weighingheader.AirlinesCode → eks_hostawb.airlinescode → eks_invoiceheader.AirlinesCode
        - flight_no  : build_up_check_header.flight_no → eks_weighingheader.FlightNumber → eks_hostawb.FlightNo
        - flight_date: build_up_check_header.flight_date → eks_weighingheader.DateOfFlight → eks_hostawb.DateOfFlight
        - origin     : eks_weighingheader.Origin (3-step fallback ke mawb saja jika flight filter gagal)
        - destination: build_up_check_header.dest → eks_weighingheader.Destination

        Args:
            header_id: ID build_up_check_header.

        Returns:
            FfmPreviewOut dengan cargo_imp/cargo_xml jika semua field tersedia,
            atau generated=False dengan missing_fields dan warnings.
        """
        header = self.repository.get_ffm_build_up_header_by_id(header_id)
        if not header:
            raise LookupError("Header build up check tidak ditemukan")

        details = [self._map_ffm_detail(header, detail) for detail in list(header.details or [])]
        missing_fields: list[str] = []
        warnings: list[str] = []

        first_legacy_header = None
        first_host = None
        first_invoice = None
        for detail in list(header.details or []):
            if not detail.mawb:
                continue
            first_legacy_header = self.repository.get_legacy_weighing_header(
                mawb=detail.mawb,
                flight_no=header.flight_no,
                flight_date=header.flight_date,
            )
            hosts = self.repository.list_legacy_host_awbs(detail.mawb)
            first_host = hosts[0] if hosts else None
            # Fallback terakhir: eks_invoiceheader via InvoiceNumber (DB2 SSoT)
            first_invoice = self.repository.get_legacy_invoice_by_mawb(detail.mawb)
            if first_legacy_header or first_host or first_invoice:
                break

        carrier = (_first_text(
            header.airlines,
            getattr(first_legacy_header, "AirlinesCode", None),
            getattr(first_host, "airlinescode", None),
            getattr(first_invoice, "AirlinesCode", None),
        ) or "").upper()
        flight_number = (_first_text(
            header.flight_no,
            getattr(first_legacy_header, "FlightNumber", None),
            getattr(first_host, "FlightNo", None),
        ) or "").upper()
        if carrier and flight_number.startswith(carrier):
            flight_number = flight_number[len(carrier):]
        flight_date = _format_ffm_date(
            _first_text(
                header.flight_date,
                getattr(first_legacy_header, "DateOfFlight", None),
                getattr(first_host, "DateOfFlight", None),
            )
        )
        origin = (_first_text(
            getattr(first_legacy_header, "Origin", None),
            getattr(first_invoice, "Origin", None),
        ) or "").upper()
        destination = (_first_text(
            header.dest,
            getattr(first_legacy_header, "Destination", None),
            getattr(first_invoice, "Destination", None),
        ) or "").upper()

        if not carrier:
            missing_fields.append("header.airlines / legacy.AirlinesCode / invoice.AirlinesCode")
        if not flight_number:
            missing_fields.append("header.flight_no / legacy.FlightNumber")
        if not flight_date:
            missing_fields.append("header.flight_date / legacy.DateOfFlight")
        if not origin:
            missing_fields.append("legacy.eks_weighingheader.Origin / invoice.Origin")
        if not destination:
            missing_fields.append("header.dest / legacy.Destination / invoice.Destination")
        if not details:
            missing_fields.append("details (build_up_check_detail)")

        uld_info = _parse_uld(header.uld)
        uld_identifier = _format_uld_identifier(uld_info, carrier)
        if not uld_identifier:
            missing_fields.append("header.uld (format ULD tidak valid untuk FFM)")

        detail_lines: list[str] = []
        if uld_identifier:
            detail_lines.append(f"ULD/{uld_identifier}")

        valid_detail_count = 0
        for index, detail in enumerate(details, start=1):
            mawb = _format_mawb_for_ffm(detail.mawb)
            pieces = _format_ffm_number(detail.pieces, 0)
            weight = _format_ffm_number(detail.weight, 1)
            volume = _format_ffm_number(detail.volume, 2)
            goods = (_first_text(detail.nature_of_goods, "GENERAL CARGO") or "GENERAL CARGO").upper()
            row_missing = []
            if not mawb:
                row_missing.append(f"details[{index}].mawb")
            if not pieces:
                row_missing.append(f"details[{index}].pieces")
            if not weight:
                row_missing.append(f"details[{index}].weight")
            if not volume:
                row_missing.append(f"details[{index}].volume")
            if row_missing:
                missing_fields.extend(row_missing)
                warnings.append(f"Detail #{index} dilewati karena data belum lengkap.")
                continue
            detail_lines.append(f"{mawb}{origin}{destination}/T{pieces}K{weight}MC{volume}/{goods}")
            valid_detail_count += 1

        generated = bool(
            carrier
            and flight_number
            and flight_date
            and origin
            and destination
            and uld_identifier
            and valid_detail_count > 0
        )
        buildup_number = self._build_ffm_number_label(header)
        if not generated:
            return FfmPreviewOut(
                header_id=header_id,
                buildup_number=buildup_number,
                generated=False,
                cargo_imp=None,
                cargo_xml=None,
                missing_fields=missing_fields,
                warnings=warnings,
            )

        cargo_imp_lines = [
            "FFM/8",
            f"1/{carrier}{flight_number}/{flight_date}/{origin}",
            destination,
            *detail_lines,
            "LAST",
        ]
        cargo_imp = "\n".join(cargo_imp_lines)
        cargo_xml = self._build_ffm_build_up_xml(
            header_id=header_id,
            buildup_number=buildup_number,
            carrier=carrier,
            flight_number=flight_number,
            flight_date=flight_date,
            origin=origin,
            destination=destination,
            uld_identifier=uld_identifier,
            details=details,
            cargo_imp=cargo_imp,
        )
        return FfmPreviewOut(
            header_id=header_id,
            buildup_number=buildup_number,
            generated=True,
            cargo_imp=cargo_imp,
            cargo_xml=cargo_xml,
            missing_fields=missing_fields,
            warnings=warnings,
        )

    @staticmethod
    def _build_ffm_number_label(header) -> str:
        flight_no = _first_text(header.flight_no, "FLIGHT") or "FLIGHT"
        flight_date = str(header.flight_date or "").replace("-", "")
        return f"BUC-{header.id}-{flight_no}-{flight_date}".strip("-")

    @classmethod
    def _map_ffm_header(cls, header) -> FfmBuildUpOut:
        details = list(header.details or [])
        mawb_values = [_clean_text(detail.mawb) for detail in details if _clean_text(detail.mawb)]
        mawb_summary = ", ".join(dict.fromkeys(mawb_values))
        total_pieces = 0
        total_weight = Decimal("0")
        has_weight = False
        for detail in details:
            pieces = _sum_rincian_pieces(list(detail.rincian or []))
            if pieces is None:
                pieces = _first_int(detail.total_pieces, detail.master_total_pieces) or 0
            total_pieces += pieces

            weight = _sum_rincian_weight(list(detail.rincian or []))
            if weight is not None:
                total_weight += Decimal(str(weight))
                has_weight = True

        uld_info = _parse_uld(header.uld)
        return FfmBuildUpOut(
            id=header.id,
            number_build_up=cls._build_ffm_number_label(header),
            mawb=mawb_summary or None,
            airlines_code=header.airlines,
            origin=None,
            dest=header.dest,
            flight_date=header.flight_date,
            uld_type=uld_info.get("uld_type"),
            uld_number=uld_info.get("uld_number"),
            uld_owner=uld_info.get("uld_owner"),
            total_pieces=total_pieces or None,
            total_weight=float(total_weight) if has_weight else None,
            create_at=header.created_at,
        )

    def _map_ffm_detail(self, header, detail) -> FfmBuildUpDetailOut:
        """
        Map satu baris BuildUpCheckDetail ke FfmBuildUpDetailOut dengan chain fallback DB2 (SSoT).

        Chain fallback untuk setiap field (DB2 READ ONLY):

        pieces:
          build_up_check_rincian (sum)
          → build_up_check_detail.total_pieces
          → build_up_check_detail.master_total_pieces
          → eks_weighingdetail.Pieces (by MasterAWB)
          → eks_weighingheader.TotalPieces (by MasterAWB)
          → eks_hostawb.Quantity (by MasterAWB)
          → eks_invoiceheader.TotalPieces (via InvoiceNumber)

        weight:
          build_up_check_rincian (sum)
          → eks_weighingdetail.GrossWeight
          → eks_weighingdetail.NettoWeight
          → eks_weighingheader.TotalNetto
          → eks_hostawb.Weight
          → eks_invoiceheader.TotalNetto

        volume:
          eks_weighingdetail.VolumeCargo
          → eks_weighingheader.TotalVolume
          → eks_hostawb.Volume
          -> hitung dari dimensi: LongCargo x WidthCargo x HighCargo (cm3 / 1_000_000 = m3)

        Args:
            header: BuildUpCheckHeader instance.
            detail: BuildUpCheckDetail instance.

        Returns:
            FfmBuildUpDetailOut dengan semua field terisi semaksimal mungkin.
        """
        mawb = _clean_text(detail.mawb)
        legacy_header = self.repository.get_legacy_weighing_header(
            mawb=mawb or "",
            flight_no=header.flight_no,
            flight_date=header.flight_date,
        )
        legacy_details = self.repository.list_legacy_weighing_details(mawb or "")
        legacy_hosts = self.repository.list_legacy_host_awbs(mawb or "")
        legacy_invoice = self.repository.get_legacy_invoice_by_mawb(mawb or "")
        legacy_detail = legacy_details[0] if legacy_details else None
        legacy_host = legacy_hosts[0] if legacy_hosts else None
        uld_info = _parse_uld(header.uld)

        # Volume: jumlahkan dari SEMUA baris eks_weighingheader (SUM TotalVolume)
        sum_volume_header = self.repository.sum_legacy_weighing_volume_by_mawb(mawb or "")
        # Volume: jumlahkan dari SEMUA baris eks_weighingdetail (SUM VolumeCargo)
        sum_volume_detail = self.repository.sum_legacy_weighing_detail_volume_by_mawb(mawb or "")

        # Hitung volume dari dimensi sebagai fallback terakhir
        volume_from_dimensions = _calc_volume_from_dimensions(
            getattr(legacy_detail, "LongCargo", None),
            getattr(legacy_detail, "WidthCargo", None),
            getattr(legacy_detail, "HighCargo", None),
        )

        pieces = _first_int(
            _sum_rincian_pieces(list(detail.rincian or [])),
            detail.total_pieces,
            detail.master_total_pieces,
            getattr(legacy_detail, "Pieces", None),
            getattr(legacy_header, "TotalPieces", None),
            getattr(legacy_host, "Quantity", None),
            getattr(legacy_invoice, "TotalPieces", None),
        )
        weight = _first_float(
            _sum_rincian_weight(list(detail.rincian or [])),
            getattr(legacy_detail, "GrossWeight", None),
            getattr(legacy_detail, "NettoWeight", None),
            getattr(legacy_header, "TotalNetto", None),
            getattr(legacy_host, "Weight", None),
            getattr(legacy_invoice, "TotalNetto", None),
        )
        # Chain fallback volume (berurutan, ambil yang pertama > 0):
        #   1. SUM(VolumeCargo) dari eks_weighingdetail    — paling granular
        #   2. SUM(TotalVolume) dari eks_weighingheader    — per proof number, dijumlah
        #   3. Volume dari eks_hostawb
        #   4. Hitung dari dimensi LongCargo x WidthCargo x HighCargo / 1_000_000
        volume = _first_float(
            sum_volume_detail,
            sum_volume_header,
            getattr(legacy_host, "Volume", None),
            volume_from_dimensions,
        )
        nature_of_goods = _first_text(
            getattr(legacy_detail, "KindOfNature", None),
            getattr(legacy_host, "descriptiongoods", None),
        )

        return FfmBuildUpDetailOut(
            id=detail.id,
            header_id=detail.header_id,
            mawb=mawb,
            uld_type=uld_info.get("uld_type"),
            uld_number=uld_info.get("uld_number"),
            uld_owner=uld_info.get("uld_owner"),
            pieces=pieces,
            weight=weight,
            volume=volume,
            nature_of_goods=nature_of_goods,
            remark=detail.remark,
            create_at=detail.created_at,
        )

    @staticmethod
    def _build_ffm_build_up_xml(  # noqa: PLR0913
        *,
        header_id: int,
        buildup_number: str,
        carrier: str,
        flight_number: str,
        flight_date: str,
        origin: str,
        destination: str,
        uld_identifier: str,
        details: list[FfmBuildUpDetailOut],
        cargo_imp: str,
    ) -> str:
        lines = ['<XFFM version="1">']
        lines.append(
            "  <Manifest "
            + f'headerId="{header_id}" '
            + f'buildupNumber="{buildup_number}" '
            + f'carrier="{carrier}" '
            + f'flightNumber="{flight_number}" '
            + f'flightDate="{flight_date}" '
            + f'origin="{origin}" '
            + f'destination="{destination}" '
            + f'uld="{uld_identifier}"'
            + " />"
        )
        lines.append("  <Details>")
        for item in details:
            lines.append(
                "    <Shipment "
                + f'mawb="{item.mawb or ""}" '
                + f'pieces="{item.pieces or ""}" '
                + f'weight="{item.weight or ""}" '
                + f'volume="{item.volume or ""}"'
                + ">"
            )
            lines.append(f"      <NatureOfGoods>{item.nature_of_goods or ''}</NatureOfGoods>")
            lines.append(f"      <Remark>{item.remark or ''}</Remark>")
            lines.append("    </Shipment>")
        lines.append("  </Details>")
        lines.append("  <CargoIMP><![CDATA[")
        lines.append(cargo_imp)
        lines.append("]]></CargoIMP>")
        lines.append("</XFFM>")
        return "\n".join(lines)

    def parse_fhl(self, awb: str) -> FhlResponse:
        header, details = self.repository.get_weighing_by_awb(awb)
        header_schema = WeighingHeaderOut.model_validate(header) if header else None
        detail_schema = [WeighingDetailOut.model_validate(item) for item in details]
        return FhlResponse(header=header_schema, details=detail_schema)

    def parse_fwb(self, awb: str) -> FwbResponse:
        header, details, agent = self.repository.get_weighing_by_awb_for_fwb(awb)
        header_schema = WeighingHeaderOut.model_validate(header) if header else None
        detail_schema = [WeighingDetailOut.model_validate(item) for item in details]
        agent_schema = CustomerOut.model_validate(agent) if agent else None
        return FwbResponse(header=header_schema, details=detail_schema, agen=agent_schema)

    def parse_awb_mawb(self, mawb: str) -> AwbMawbResponse | None:
        return self.repository.get_awb_mawb(mawb)

    def generate_fhl_message(self, mawb: str) -> FhlMessageOut:
        """Generate FHL Cargo-IMP and Cargo-XML from MAWB payload."""
        payload = self.parse_awb_mawb(mawb)
        if payload is None:
            raise LookupError("Master AWB tidak ditemukan")

        cargo_imp, cargo_xml = build_fhl_messages(payload.model_dump(), fallback_mawb=mawb)
        return FhlMessageOut(master_awb=mawb, cargo_imp=cargo_imp, cargo_xml=cargo_xml)

    def get_imp_masterwaybill(self, mawb: str) -> ImpMasterWaybillOut | None:
        return self.repository.get_imp_masterwaybill(mawb)

    def get_imp_hostawb(self, mawb: str) -> list[ImpHostAWBOut]:
        return self.repository.get_imp_hostawb(mawb)


    def get_saved_fwb(self, mawb: str) -> FwbTableOut | None:
        """Retrieve stored FWB data by MAWB."""
        record = self.repository.get_fwb_by_mawb(mawb)
        return FwbTableOut.model_validate(record) if record else None

    def get_saved_fwb_record(self, mawb: str):
        """Retrieve raw FWB model instance by MAWB."""
        return self.repository.get_fwb_by_mawb(mawb)

    def save_fwb_from_payload(self, payload: dict[str, Any], raw_message: str | None) -> FwbTableOut | None:
        """
        Persist FWB payload into DB1.
        Returns saved record or None when MAWB cannot be resolved.
        """
        resolved = _build_fwb_values(payload, raw_message)
        if resolved is None:
            return None
        mawb, values = resolved

        record = self.repository.upsert_fwb(mawb, values)
        return FwbTableOut.model_validate(record)

    def generate_fwb_preview_from_payload(self, payload: dict[str, Any]) -> FwbMessageOut | None:
        """Generate FWB Cargo-IMP and Cargo-XML directly from payload without saving."""
        resolved = _build_fwb_values(payload, raw_message=None)
        if resolved is None:
            return None
        mawb, values = resolved
        preview_record = SimpleNamespace(**values)
        cargo_imp = build_fwb_cargo_imp(preview_record)
        cargo_xml = build_fwb_cargo_xml(preview_record, cargo_imp)
        return FwbMessageOut(mawb=mawb, cargo_imp=cargo_imp, cargo_xml=cargo_xml)

    def generate_fwb_message(self, mawb: str) -> FwbMessageOut:
        """Generate FWB Cargo-IMP and Cargo-XML from saved FWB data."""
        record = self.get_saved_fwb_record(mawb)
        if record is None:
            raise LookupError("FWB data tidak ditemukan")

        cargo_imp = build_fwb_cargo_imp(record)
        cargo_xml = build_fwb_cargo_xml(record, cargo_imp)
        return FwbMessageOut(mawb=mawb, cargo_imp=cargo_imp, cargo_xml=cargo_xml)

    @staticmethod
    async def send_email_edi(email: str, message: str, edi: str):
        try:
            if "@" not in email:
                logger.warning("Invalid email format for EDI send: %s", email)
                raise ValueError("Invalid email format")
            template = jinja_env.get_template("email-template/fhl.html")
            html_str = template.render({"message": message, "edi": edi})

            logger.info("Sending EDI email to %s for %s", email, edi)
            await smtp_email_service.send_email(
                to_email=email,
                subject="EDI Messages " + edi,
                html_body=html_str,
            )
            logger.info("EDI email sent to %s for %s", email, edi)
        except ValueError as e:
            logger.warning("Sending EDI email failed due to input validation: %s", e)
            raise ValueError("Sending email error") from e
        except Exception:
            logger.exception("Sending EDI email failed to %s for %s", email, edi)
            raise

