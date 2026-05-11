from __future__ import annotations

import re
from html import escape
from typing import Any

_ADDRESS_LINE_LIMIT = 35
_MAWB_PATTERN = re.compile(r"^[A-Z0-9]{3}-[A-Z0-9]{1,8}$")
_IATA_PATTERN = re.compile(r"^[A-Z]{3}$")


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split()).strip()


def _to_upper(value: Any) -> str:
    return _normalize_text(value).upper()


def _sanitize_cargo_imp_text(value: Any, max_length: int = 0) -> str:
    if value is None:
        return ""
    text = _to_upper(value)
    text = text.replace("/", " ").replace("\\", " ")
    text = re.sub(r"[^A-Z0-9 .-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if max_length > 0:
        text = text[:max_length].strip()
    return text


def _format_mawb(mawb: Any) -> str:
    cleaned = re.sub(r"[^A-Z0-9]", "", _sanitize_cargo_imp_text(mawb))
    if not cleaned:
        return ""
    if len(cleaned) >= 11:
        return f"{cleaned[:3]}-{cleaned[3:11]}"
    if len(cleaned) > 3:
        return f"{cleaned[:3]}-{cleaned[3:]}"
    return cleaned


def _normalize_iata_code(value: Any) -> str:
    return re.sub(r"[^A-Z]", "", _sanitize_cargo_imp_text(value))[:3]


def _normalize_hawb(value: Any) -> str:
    return re.sub(r"[^A-Z0-9.-]", "", _sanitize_cargo_imp_text(value))[:20]


def _to_number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _format_weight(value: Any) -> str:
    number = _to_number(value)
    rounded = round(number, 1)
    if rounded.is_integer():
        return str(int(rounded))
    return str(rounded)


def _strip_admin_tokens(value: str) -> str:
    text = re.sub(r"\b(KEC|KEL)\b", "", value)
    return re.sub(r"\s+", " ", text).strip()


def _normalize_address_line(value: Any) -> str:
    text = _sanitize_cargo_imp_text(value)
    text = re.sub(r"\s*-\s*", "-", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^ADR/", "", text)
    text = re.sub(r"^/+", "", text)
    text = re.sub(r"^\\+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _split_by_length(text: str, limit: int) -> tuple[str, str]:
    if not text:
        return "", ""
    if len(text) <= limit:
        return text, ""

    words = text.split(" ")
    current: list[str] = []
    index = 0
    for _index, word in enumerate(words):
        candidate = " ".join([*current, word]).strip()
        if len(candidate) > limit:
            break
        current.append(word)
    else:
        return " ".join(words).strip(), ""

    if not current:
        return text[:limit], text[limit:].strip()

    first = " ".join(current).strip()
    rest = " ".join(words[index:]).strip()
    return first, rest


def _build_address_lines(address1: Any, address2: Any, fallback_parts: list[str]) -> list[str]:
    raw_lines = [
        line
        for line in (_normalize_address_line(address1), _normalize_address_line(address2))
        if line
    ]
    if not raw_lines:
        fallback = " ".join(
            [part for part in (_normalize_address_line(item) for item in fallback_parts) if part]
        ).strip()
        if fallback:
            raw_lines = [fallback]
        else:
            return []

    line1 = raw_lines[0]
    line2 = " ".join(raw_lines[1:]).strip()

    comma_split = [part.strip() for part in line1.split(",") if part.strip()]
    if len(comma_split) > 1:
        line1 = comma_split[0]
        line2 = " ".join([*comma_split[1:], line2]).strip()

    if not line2:
        line1, line2 = _split_by_length(line1, _ADDRESS_LINE_LIMIT)
    elif len(line1) > _ADDRESS_LINE_LIMIT:
        first, rest = _split_by_length(line1, _ADDRESS_LINE_LIMIT)
        line1 = first
        line2 = " ".join([rest, line2]).strip()

    if line2 and len(line2) > _ADDRESS_LINE_LIMIT:
        line2 = _strip_admin_tokens(line2)
    if line2 and len(line2) > _ADDRESS_LINE_LIMIT:
        line2, _ = _split_by_length(line2, _ADDRESS_LINE_LIMIT)

    lines = [line1]
    if line2:
        lines.append(_normalize_address_line(line2))
    return [line for line in lines if line]


def _normalize_party_data(party: dict[str, Any] | None, fallback_code: str) -> dict[str, str]:
    party_data = party or {}
    return {
        "name": str(
            party_data.get("CompanyName")
            or party_data.get("name")
            or fallback_code
            or ""
        ),
        "address1": str(
            party_data.get("Address1")
            or party_data.get("address1")
            or party_data.get("address")
            or ""
        ),
        "address2": str(party_data.get("Address2") or party_data.get("address2") or ""),
        "city": str(party_data.get("City") or party_data.get("city") or ""),
        "country": str(party_data.get("CountryCode") or party_data.get("country") or ""),
        "postal": str(party_data.get("PostCode") or party_data.get("postal") or ""),
    }


def _extract_host_party(item: dict[str, Any], party_type: str) -> dict[str, str] | None:
    if party_type == "shipper":
        party = {
            "name": item.get("shippername") or item.get("ShipperName") or "",
            "address1": item.get("shipperaddress") or item.get("ShipperAddress") or "",
            "city": item.get("shippercity") or item.get("ShipperCity") or "",
            "country": item.get("shippercountry") or item.get("ShipperCountry") or "",
            "postal": item.get("shipperpostal") or item.get("ShipperPostal") or "",
        }
    else:
        party = {
            "name": item.get("Consigneename") or item.get("ConsigneeName") or "",
            "address1": item.get("Consigneeaddress") or item.get("ConsigneeAddress") or "",
            "city": item.get("Consigneecity") or item.get("ConsigneeCity") or "",
            "country": item.get("Consigneecountry") or item.get("ConsigneeCountry") or "",
            "postal": item.get("Consigneepostal") or item.get("ConsigneePostal") or "",
        }
    has_value = any(_normalize_text(value) for value in party.values())
    return party if has_value else None


def _build_party_block(tag: str, party: dict[str, Any] | None, fallback_code: str) -> list[str]:
    lines: list[str] = []
    normalized = _normalize_party_data(party, fallback_code)
    name = _sanitize_cargo_imp_text(normalized.get("name"), 35)
    if not name:
        return lines

    lines.append(tag)
    lines.append(f"NAM/{name}")

    address_lines = _build_address_lines(
        normalized.get("address1"),
        normalized.get("address2"),
        [normalized.get("city", ""), normalized.get("country", ""), normalized.get("postal", "")],
    )
    if address_lines:
        lines.append(f"ADR/{address_lines[0]}")
        if len(address_lines) > 1:
            lines.append(f"/{_normalize_address_line(address_lines[1])}")

    city = _sanitize_cargo_imp_text(normalized.get("city"), 35)
    country = re.sub(r"[^A-Z]", "", _sanitize_cargo_imp_text(normalized.get("country")))[:2]
    if city or country:
        lines.append(f"LOC/{city or 'UNKNOWN'}/{country or 'ID'}")

    return lines


def _get_txt_lines(item: dict[str, Any], header: dict[str, Any]) -> list[str]:
    candidates = (
        item.get("Remarks")
        or item.get("Remark")
        or item.get("TXT")
        or item.get("Txt")
        or item.get("TxtLines")
        or item.get("descriptiongoods")
        or item.get("descriptionGoods")
        or header.get("Remarks")
        or header.get("TXT")
        or ""
    )

    lines: list[str] = []
    iterable = candidates if isinstance(candidates, list) else [candidates]

    for entry in iterable:
        cleaned = _sanitize_cargo_imp_text(entry, 65)
        if cleaned:
            lines.append(cleaned)

    if not lines:
        fallback = _sanitize_cargo_imp_text(
            item.get("KindOfNature") or header.get("KindOfGood") or "",
            65,
        )
        if fallback:
            lines.append(fallback)
    return lines


def _validate_fhl_payload(
    mawb: str,
    origin: str,
    destination: str,
    normalized_houses: list[dict[str, Any]],
) -> None:
    validation_errors: list[str] = []
    if not _MAWB_PATTERN.match(mawb):
        validation_errors.append(
            "MAWB tidak valid. Gunakan format AWB (prefix 3 karakter dan serial, contoh: 220-12345675)."
        )

    if not _IATA_PATTERN.match(origin) or not _IATA_PATTERN.match(destination):
        validation_errors.append("Origin dan Destination wajib kode IATA 3 huruf.")

    if not normalized_houses:
        validation_errors.append("Data HAWB tidak ditemukan.")

    for index, house in enumerate(normalized_houses, start=1):
        if not house["hawb"]:
            validation_errors.append(f"HAWB pada baris {index} kosong atau tidak valid.")
        if house["pieces"] <= 0:
            validation_errors.append(
                f"Pieces pada HAWB {house['hawb'] or f'baris {index}'} harus lebih dari 0."
            )
        if house["weight"] < 0:
            validation_errors.append(
                f"Weight pada HAWB {house['hawb'] or f'baris {index}'} tidak boleh negatif."
            )

    if validation_errors:
        raise ValueError(f"Validasi FHL gagal: {' '.join(validation_errors)}")


def _build_cargo_xml(
    mawb: str,
    origin: str,
    destination: str,
    houses: list[dict[str, Any]],
    include_parties: bool,
) -> str:
    xml_lines = ['<FHL version="5">']
    xml_lines.append(
        f'  <MBI mawb="{escape(mawb)}" origin="{escape(origin)}" destination="{escape(destination)}" />'
    )
    xml_lines.append("  <Houses>")
    for house in houses:
        xml_lines.append(
            "    "
            + f'<House hawb="{escape(house["hawb"])}" pieces="{house["pieces"]}" '
            + f'weightUnit="K" weight="{escape(_format_weight(house["weight"]))}" '
            + f'nature="{escape(house["nature"])}">'
        )
        for txt_line in house["txt_lines"]:
            xml_lines.append(f"      <TXT>{escape(txt_line)}</TXT>")
        if include_parties:
            for party_label, party_data in (("Shipper", house["shipper"]), ("Consignee", house["consignee"])):
                normalized_party = _normalize_party_data(party_data, "")
                if not _sanitize_cargo_imp_text(normalized_party.get("name"), 35):
                    continue
                xml_lines.append(f"      <{party_label}>")
                xml_lines.append(
                    f'        <Name>{escape(_sanitize_cargo_imp_text(normalized_party.get("name"), 35))}</Name>'
                )
                for idx, line in enumerate(
                    _build_address_lines(
                        normalized_party.get("address1"),
                        normalized_party.get("address2"),
                        [
                            normalized_party.get("city", ""),
                            normalized_party.get("country", ""),
                            normalized_party.get("postal", ""),
                        ],
                    ),
                    start=1,
                ):
                    xml_lines.append(f"        <AddressLine{idx}>{escape(line)}</AddressLine{idx}>")
                xml_lines.append(
                    f'        <City>{escape(_sanitize_cargo_imp_text(normalized_party.get("city"), 35))}</City>'
                )
                country = re.sub(
                    r"[^A-Z]",
                    "",
                    _sanitize_cargo_imp_text(normalized_party.get("country")),
                )[:2]
                xml_lines.append(f"        <Country>{escape(country or 'ID')}</Country>")
                xml_lines.append(f"      </{party_label}>")
        xml_lines.append("    </House>")
    xml_lines.append("  </Houses>")
    xml_lines.append("</FHL>")
    return "\n".join(xml_lines)


def build_fhl_messages(  # noqa: PLR0912, PLR0915
    payload: dict[str, Any], fallback_mawb: str | None = None
) -> tuple[str, str]:
    """Build FHL Cargo-IMP and Cargo-XML text from AWB/MAWB payload."""

    master = payload.get("master") or {}
    header = payload.get("header") or master
    hosts = payload.get("host_awbs") if isinstance(payload.get("host_awbs"), list) else []
    details = payload.get("details") if isinstance(payload.get("details"), list) else []

    mawb = _format_mawb(master.get("MasterAWB") or header.get("MasterAWB") or fallback_mawb)
    origin = _normalize_iata_code(master.get("Origin") or header.get("Origin") or "") or "XXX"
    destination = _normalize_iata_code(master.get("Destination") or header.get("Destination") or "") or "XXX"
    airlines_code = _to_upper(
        master.get("AirlinesCode") or master.get("airlinescode") or (hosts[0].get("airlinescode") if hosts else "")
    )
    include_parties = airlines_code != "FX"

    if hosts:
        houses = hosts
    elif details:
        houses = details
    else:
        houses = [
            {
                "HostAWB": master.get("MasterAWB") or header.get("MasterAWB") or fallback_mawb or "",
                "Pieces": master.get("Pieces") or master.get("TotalPieces") or header.get("TotalPieces") or 0,
                "NettoWeight": master.get("Weight") or master.get("TotalNetto") or header.get("TotalNetto") or 0,
                "KindOfNature": master.get("KindOfGood") or header.get("KindOfGood") or "GENERAL CARGO",
            }
        ]

    normalized_houses: list[dict[str, Any]] = []
    for item in houses:
        if not isinstance(item, dict):
            continue
        hawb = _normalize_hawb(
            item.get("HostAWB")
            or item.get("ProofNumber")
            or master.get("MasterAWB")
            or header.get("MasterAWB")
            or fallback_mawb
            or ""
        )
        pieces = _to_number(item.get("Quantity") or item.get("Pieces") or item.get("pieces") or 0)
        weight = _to_number(
            item.get("Weight")
            or item.get("GrossWeight")
            or item.get("NettoWeight")
            or item.get("Netto")
            or 0
        )
        nature = _sanitize_cargo_imp_text(
            item.get("descriptiongoods")
            or item.get("KindOfNature")
            or item.get("KindOfCode")
            or master.get("KindOfGood")
            or header.get("KindOfGood")
            or "GENERAL CARGO",
            65,
        )
        normalized_houses.append(
            {
                "hawb": hawb,
                "pieces": int(pieces) if pieces.is_integer() else pieces,
                "weight": weight,
                "nature": nature,
                "txt_lines": _get_txt_lines(item, master if isinstance(master, dict) else {}),
                "shipper": _extract_host_party(item, "shipper")
                or payload.get("shipper")
                or header.get("shipper"),
                "consignee": _extract_host_party(item, "consignee") or header.get("consignee"),
                "shipper_code": item.get("ShipperCode") or master.get("ShipperCode") or header.get("ShipperCode") or "",
                "consignee_code": item.get("ConsigneeCode")
                or master.get("ConsigneeCode")
                or header.get("ConsigneeCode")
                or "",
            }
        )

    _validate_fhl_payload(mawb, origin, destination, normalized_houses)

    total_pieces = sum(float(item["pieces"]) for item in normalized_houses)
    total_weight = sum(float(item["weight"]) for item in normalized_houses)
    total_pieces_text = int(total_pieces) if total_pieces.is_integer() else total_pieces

    lines: list[str] = []
    lines.append("FHL/5")
    lines.append(f"MBI/{mawb}{origin}{destination}/T{total_pieces_text}K{_format_weight(total_weight)}")

    for item in normalized_houses:
        hbs_nature = _sanitize_cargo_imp_text(item["nature"], 65)
        txt_lines = list(item["txt_lines"])

        hbs_text = hbs_nature
        hbs_remainder = ""
        if len(hbs_nature) > 15:
            hbs_text, hbs_remainder = _split_by_length(hbs_nature, 15)

        hbs_key = _to_upper(hbs_nature)
        seen_txt: set[str] = set()
        unique_txt_lines: list[str] = []
        for text in txt_lines:
            cleaned = _sanitize_cargo_imp_text(text, 65)
            if not cleaned:
                continue
            key = _to_upper(cleaned)
            if key in seen_txt or key == hbs_key:
                continue
            seen_txt.add(key)
            unique_txt_lines.append(cleaned)

        if hbs_remainder:
            remainder_key = _to_upper(hbs_remainder)
            if remainder_key not in seen_txt:
                seen_txt.add(remainder_key)
                unique_txt_lines.insert(0, hbs_remainder)

        lines.append(
            f"HBS/{item['hawb']}/{origin}{destination}/{item['pieces']}/K{_format_weight(item['weight'])}//{hbs_text}"
        )
        for text in unique_txt_lines:
            lines.append(f"TXT/{text[:65]}")

        if include_parties:
            lines.extend(_build_party_block("SHP", item["shipper"], str(item["shipper_code"])))
            lines.extend(
                _build_party_block("CNE", item["consignee"], str(item["consignee_code"]))
            )

    cargo_imp = "\n".join([line for line in lines if line]).strip()
    cargo_xml = _build_cargo_xml(mawb, origin, destination, normalized_houses, include_parties)
    return cargo_imp, cargo_xml
