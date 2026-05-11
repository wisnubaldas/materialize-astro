import logging
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from types import SimpleNamespace
from typing import Any

from app.libs.fhl_message_builder import build_fhl_messages
from app.libs.fwb_message_builder import build_fwb_cargo_imp, build_fwb_cargo_xml
from app.repositories.edi_repository import EdiRepository
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.build_up_detail_schema import BuildUpDetailOut
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
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
    data_table_response = DataTablesResponse[EksBuildupHeaderOut]

    def __init__(self, repo: EdiRepository):
        self.repository = repo

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildupHeaderOut]:
        return self.repository.datatable(params)

    def buildup_detail_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.repository.buildup_detail_datatable(params)

    def weighing_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[WeighingHeaderOut]:
        return self.repository.weighing_datatable(params)

    def masterwaybill_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def manifest_mawb_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[BuildUpDetailOut]:
        """Datatable accessor for build_up_detail (DB1)."""
        return self.repository.manifest_mawb_datatable(params)

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

    def fetch_data_buildup_mawb(self, buildup_number: str):
        return self.repository.get_buildup_mawb(buildup_number)

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

