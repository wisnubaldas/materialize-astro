from __future__ import annotations

from datetime import date, datetime
from html import escape

from app.models.BaseDB1.fwb import Fwb


def _to_text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_awb(prefix: str, number: str, mawb: str) -> str:
    if prefix and number:
        return f"{prefix}-{number}"
    return mawb


def _alnum_upper(value: object) -> str:
    return "".join(ch for ch in _to_text(value).upper() if ch.isalnum())


def _flight_id(record: Fwb) -> str:
    """Build FLT flight identifier as <carrier><flight_number>."""
    raw = _alnum_upper(record.flight_number or record.flight_no)
    carrier = _alnum_upper(record.flight_carrier)[:3]
    if not carrier:
        carrier = "".join(ch for ch in raw if ch.isalpha())[:3] or "XX"

    flight_number = "".join(ch for ch in raw if ch.isdigit())[:4]
    if not flight_number:
        flight_number = "0"

    return f"{carrier}{flight_number}"


def _flight_day(record: Fwb) -> str:
    """Build FLT day element (2-digit day-of-month)."""
    flight_date = getattr(record, "flight_date", None)
    if isinstance(flight_date, datetime):
        return f"{flight_date.day:02d}"
    if isinstance(flight_date, date):
        return f"{flight_date.day:02d}"
    if isinstance(flight_date, str):
        try:
            parsed = datetime.fromisoformat(flight_date[:10])
            return f"{parsed.day:02d}"
        except ValueError:
            pass
    return "01"


def _routing_value(record: Fwb, destination: str) -> str:
    """
    Build RTG payload and guarantee at least one routing point.
    Format uses destination+carrier, e.g. RTG/SINFX or RTG/LHRII.
    """
    raw = _to_text(record.routing_list or record.routing).upper()
    carrier_fallback = (_alnum_upper(record.first_carrier or record.flight_carrier)[:2] or "II")

    if not raw:
        return f"{destination}{carrier_fallback}"

    tokens = [
        "".join(ch for ch in token if ch.isalnum())
        for token in raw.replace(",", "/").replace(";", "/").replace(" ", "/").split("/")
    ]
    tokens = [token for token in tokens if token]
    if not tokens:
        return f"{destination}{carrier_fallback}"

    normalized: list[str] = []
    for token in tokens:
        if len(token) >= 5:
            normalized.append(token[:5])
        elif len(token) == 3:
            normalized.append(f"{token}{carrier_fallback}")
        elif len(token) == 2:
            continue

    if not normalized:
        return f"{destination}{carrier_fallback}"
    return "/".join(normalized[:3])


def _party_loc_lines(city: object, country: object, state: object | None = None) -> list[str]:
    """
    Build Cargo-IMP location in two-line style:
    LOC/<city>[/<state>]
    /<country>
    """
    city_token = _to_text(city).upper() or "UNKNOWN"
    country_token = (_to_text(country) or "XX").upper()
    state_token = _to_text(state).upper()

    first_line = f"LOC/{city_token}"
    if state_token:
        first_line = f"{first_line}/{state_token}"
    return [first_line, f"/{country_token}"]


def build_fwb_cargo_imp(record: Fwb) -> str:  # noqa: PLR0912
    """Build Cargo-IMP FWB text from saved DB record."""
    if record.raw_message:
        return record.raw_message

    awb = _normalize_awb(
        _to_text(record.awb_prefix),
        _to_text(record.awb_number),
        _to_text(record.mawb),
    )
    origin = (_to_text(record.origin) or "XXX").upper()
    destination = (_to_text(record.destination) or "XXX").upper()
    message_type = (_to_text(record.message_type) or "FWB").upper()
    message_version = _to_text(record.message_version) or "17"
    shipment_description = (_to_text(record.shipment_description_code) or "T").upper()
    pieces = _to_text(record.total_pieces or record.pieces or 0)
    weight_unit = (_to_text(record.weight_unit) or "K").upper()
    gross_weight = _to_text(record.gross_weight or record.weight or 0)

    lines: list[str] = []
    lines.append(f"{message_type}/{message_version}")
    lines.append(f"{awb}{origin}{destination}/{shipment_description}{pieces}{weight_unit}{gross_weight}")
    lines.append(f"FLT/{_flight_id(record)}/{_flight_day(record)}")
    lines.append(f"RTG/{_routing_value(record, destination)}")

    if record.shipper_name:
        lines.append("SHP")
        lines.append(f"NAM/{_to_text(record.shipper_name).upper()}")
        if record.shipper_address:
            lines.append(f"ADR/{_to_text(record.shipper_address).upper()}")
        if record.shipper_city:
            lines.extend(
                _party_loc_lines(
                    record.shipper_city,
                    record.shipper_country or "ID",
                    record.shipper_state,
                )
            )

    if record.consignee_name:
        lines.append("CNE")
        lines.append(f"NAM/{_to_text(record.consignee_name).upper()}")
        if record.consignee_address:
            lines.append(f"ADR/{_to_text(record.consignee_address).upper()}")
        if record.consignee_city:
            lines.extend(
                _party_loc_lines(
                    record.consignee_city,
                    record.consignee_country or "XX",
                    record.consignee_state,
                )
            )

    if record.agent_account or record.agent_name:
        agent_account = _alnum_upper(record.agent_account)[:14] or "0000000"
        lines.append(f"AGT//{agent_account}")
        if record.agent_name:
            lines.append(f"/{_to_text(record.agent_name).upper()}")
        if record.agent_city:
            lines.append(f"/{_to_text(record.agent_city).upper()}")

    if record.currency or record.weight_charge_pp_cc:
        lines.append(
            "CVD/"
            + f"{(_to_text(record.currency) or 'USD').upper()}/"
            + f"{_to_text(record.charge_code).upper()}/"
            + f"{(_to_text(record.weight_charge_pp_cc) or 'PP').upper()}/"
            + f"{(_to_text(record.declared_value_carriage) or 'NVD').upper()}/"
            + f"{(_to_text(record.declared_value_customs) or 'NCV').upper()}/"
            + f"{(_to_text(record.insurance_value) or 'XXX').upper()}"
        )

    if record.rate_line_no or record.pieces or record.weight:
        lines.append(
            "RTD/"
            + f"{_to_text(record.rate_line_no) or '1'}/"
            + f"P{_to_text(record.pieces or 0)}/"
            + f"K{_to_text(record.weight or 0)}/"
            + f"C{(_to_text(record.rate_class) or 'M').upper()}/"
            + f"W{_to_text(record.chargeable_weight or record.weight or 0)}/"
            + f"R{_to_text(record.rate or 0)}/"
            + f"T{_to_text(record.total_charge or 0)}"
        )

    if record.goods_description:
        lines.append(f"/NG/{_to_text(record.goods_description).upper()}")

    return "\n".join([line for line in lines if line])


def build_fwb_cargo_xml(record: Fwb, cargo_imp: str) -> str:
    """Build simple Cargo-XML preview from saved DB record."""
    awb = _normalize_awb(
        _to_text(record.awb_prefix),
        _to_text(record.awb_number),
        _to_text(record.mawb),
    )
    xml_lines = ['<FWB version="17">']
    xml_lines.append(
        "  "
        + f'<AWB number="{escape(awb)}" origin="{escape(_to_text(record.origin))}" '
        + f'destination="{escape(_to_text(record.destination))}" />'
    )
    xml_lines.append("  <Shipment>")
    xml_lines.append(f"    <Pieces>{escape(_to_text(record.total_pieces or record.pieces or 0))}</Pieces>")
    xml_lines.append(f"    <Weight unit=\"{escape(_to_text(record.weight_unit) or 'K')}\">{escape(_to_text(record.gross_weight or record.weight or 0))}</Weight>")
    xml_lines.append(f"    <Description>{escape(_to_text(record.goods_description))}</Description>")
    xml_lines.append("  </Shipment>")
    xml_lines.append("  <Parties>")
    xml_lines.append(f"    <Shipper>{escape(_to_text(record.shipper_name))}</Shipper>")
    xml_lines.append(f"    <Consignee>{escape(_to_text(record.consignee_name))}</Consignee>")
    xml_lines.append(f"    <Agent>{escape(_to_text(record.agent_name))}</Agent>")
    xml_lines.append("  </Parties>")
    xml_lines.append("  <CargoIMP><![CDATA[")
    xml_lines.append(cargo_imp)
    xml_lines.append("]]></CargoIMP>")
    xml_lines.append("</FWB>")
    return "\n".join(xml_lines)
