from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

# ----------------------------
# Data models (simple & practical)
# ----------------------------


@dataclass
class Party:
    name: str | None = None
    address: str | None = None
    location: str | None = None
    country: str | None = None
    postal: str | None = None
    phone: str | None = None
    fax: str | None = None
    telex: str | None = None
    email: str | None = None

    def is_empty(self) -> bool:
        return not any(
            [
                self.name,
                self.address,
                self.location,
                self.country,
                self.postal,
                self.phone,
                self.fax,
                self.telex,
                self.email,
            ]
        )


@dataclass
class House:
    hwb: str
    origin: str
    destination: str
    pieces: int
    weight: float
    weight_unit: str = "K"
    nature: str | None = None
    goods_desc: str | None = None
    txt_lines: list[str] | None = None
    shipper: Party | None = None
    consignee: Party | None = None


@dataclass
class Master:
    mawb: str  # e.g. "618-12345675"
    origin: str  # e.g. "SIN"
    destination: str  # e.g. "JFK"
    total_pieces: int
    total_weight: float
    weight_unit: str = "K"
    flight_no: str | None = None
    flight_date: str | None = None  # keep as "DDMMM" or "YYYY-MM-DD" as your system wants
    currency: str = "USD"
    prepaid_collect: str = "PP"  # PP/CC
    dv_carriage: str = "NVD"
    dv_customs: str = "NCV"
    dv_insurance: str = "XXX"


@dataclass
class FHLRequest:
    master: Master
    houses: list[House]
    default_shipper: Party | None = None
    default_consignee: Party | None = None


# ----------------------------
# Formatting helpers
# ----------------------------


def _clean(s: str | None) -> str | None:
    if s is None:
        return None
    s = str(s).strip()
    return s if s else None


def _line(*parts: str) -> str:
    return "".join(parts)


def _format_party_block(tag: str, party: Party) -> list[str]:
    """
    Format SHP/CNE block.
    Example:
      SHP
      NAM/xxx
      ADR/xxx
      LOC/xxx
      /SG/12345/TE/....
    """
    lines: list[str] = []
    if party is None or party.is_empty():
        return lines

    lines.append(tag)
    if _clean(party.name):
        lines.append(f"NAM/{_clean(party.name)}")
    if _clean(party.address):
        lines.append(f"ADR/{_clean(party.address)}")
    if _clean(party.location):
        lines.append(f"LOC/{_clean(party.location)}")

    # Optional "slash line" commonly used in examples
    slash_parts = []
    if _clean(party.country):
        slash_parts.append(_clean(party.country))
    else:
        slash_parts.append("")  # keep position

    if _clean(party.postal):
        slash_parts.append(_clean(party.postal))
    else:
        slash_parts.append("")

    # contacts
    if _clean(party.fax):
        slash_parts.append(f"FX/{_clean(party.fax)}")
    if _clean(party.phone):
        slash_parts.append(f"TE/{_clean(party.phone)}")
    if _clean(party.telex):
        slash_parts.append(f"TL/{_clean(party.telex)}")
    if _clean(party.email):
        slash_parts.append(f"EM/{_clean(party.email)}")

    # only add slash-line if it has meaningful info besides empty country/postal placeholders
    meaningful = any(
        x and x not in ["", None] and not x.startswith(("FX/", "TE/", "TL/", "EM/"))
        for x in slash_parts[:2]
    ) or any(x.startswith(("FX/", "TE/", "TL/", "EM/")) for x in slash_parts)
    if meaningful:
        # '/SG/1738/TE/....'
        lines.append("/" + "/".join(slash_parts).strip("/"))

    return lines


def _format_hbs(h: House) -> list[str]:
    """
    Example (based on your sample-ish):
      HBS/AEI12345678/SINJFK/1/K400/4/COMPUTER PARTS
    We'll keep a practical mapping:
      HBS/{hwb}/{orig}{dest}/{pieces}/{unit}{weight}//{goods_desc or nature}
    """
    origdest = f"{h.origin}{h.destination}"
    w = int(h.weight) if float(h.weight).is_integer() else h.weight
    goods = _clean(h.goods_desc) or _clean(h.nature) or "GEN"
    # Some implementations include extra fields like volume/SLAC etc; keep minimal but valid-ish.
    hbs = f"HBS/{h.hwb}/{origdest}/{h.pieces}/{h.weight_unit}{w}//{goods}"
    lines = [hbs]

    # TXT can repeat multiple lines
    if h.txt_lines:
        for t in h.txt_lines:
            t = _clean(t)
            if t:
                lines.append(f"TXT/{t}")

    return lines


def _format_mbi(m: Master) -> str:
    """
    Example from sample:
      MBI/618-12345675SINJFK/T7K1000
    We'll build: MBI/{mawb}{orig}{dest}/T{pieces}{unit}{weight}
    """
    w = int(m.total_weight) if float(m.total_weight).is_integer() else m.total_weight
    return f"MBI/{m.mawb}{m.origin}{m.destination}/T{m.total_pieces}{m.weight_unit}{w}"


def _format_cvd(m: Master) -> str:
    # CVD/{currency}/{PP|CC}/{NVD}/{NCV}/{XXX}
    return f"CVD/{m.currency}/{m.prepaid_collect}/{m.dv_carriage}/{m.dv_customs}/{m.dv_insurance}"


# ----------------------------
# Core generator with splitting
# ----------------------------


def build_fhl_message(
    req: FHLRequest,
    houses_subset: list[House],
    include_default_parties_at_top: bool = False,
) -> str:
    """
    Build a single FHL message string for a subset of houses.
    Strategy:
    - FHL/5
    - MBI/...
    - (optional) default SHP/CNE at top (if you want "global default")
    - For each house:
        HBS...
        if house.shipper exists -> SHP block
        else if default exists and not include_default_parties_at_top -> SHP block (repeated per house not needed, so we skip)
        similarly for consignee
    - CVD/...
    """
    lines: list[str] = []
    lines.append("FHL/5")
    lines.append(_format_mbi(req.master))

    # Option A: Put default shipper/consignee once at the top (only if you want)
    if include_default_parties_at_top:
        if req.default_shipper and not req.default_shipper.is_empty():
            lines.extend(_format_party_block("SHP", req.default_shipper))
        if req.default_consignee and not req.default_consignee.is_empty():
            lines.extend(_format_party_block("CNE", req.default_consignee))

    # Houses
    for h in houses_subset:
        lines.extend(_format_hbs(h))

        # Party handling:
        # - If per-house provided, print it.
        # - Else if not included at top, and you want defaults to apply implicitly, you can skip printing.
        # - But if you want each house explicitly carries parties, uncomment fallback printing below.
        if h.shipper and not h.shipper.is_empty():
            lines.extend(_format_party_block("SHP", h.shipper))
        else:
            # fallback: if you want defaults printed per-house (rare), enable:
            # if req.default_shipper and not req.default_shipper.is_empty() and not include_default_parties_at_top:
            #     lines.extend(_format_party_block("SHP", req.default_shipper))
            pass

        if h.consignee and not h.consignee.is_empty():
            lines.extend(_format_party_block("CNE", h.consignee))
        else:
            # fallback per-house default printing if needed:
            # if req.default_consignee and not req.default_consignee.is_empty() and not include_default_parties_at_top:
            #     lines.extend(_format_party_block("CNE", req.default_consignee))
            pass

    # CVD at end
    lines.append(_format_cvd(req.master))
    return "\n".join(lines) + "\n"


def split_houses(
    req: FHLRequest,
    max_houses_per_file: int = 80,
    max_chars_per_file: int | None = None,
    include_default_parties_at_top: bool = False,
) -> list[str]:
    """
    Returns list of FHL message strings (1..N).
    Splitting rules:
    - Primary: chunk by max_houses_per_file
    - Optional: enforce max_chars_per_file by further splitting
    """
    houses = req.houses
    if not houses:
        return [
            build_fhl_message(
                req, [], include_default_parties_at_top=include_default_parties_at_top
            )
        ]

    # 1) chunk by house count
    chunks: list[list[House]] = []
    for i in range(0, len(houses), max_houses_per_file):
        chunks.append(houses[i : i + max_houses_per_file])

    # 2) optional: chunk again by max chars
    messages: list[str] = []
    if max_chars_per_file is None:
        for ch in chunks:
            messages.append(
                build_fhl_message(
                    req, ch, include_default_parties_at_top=include_default_parties_at_top
                )
            )
        return messages

    # enforce by char length: greedy packing (do not split within a house block)
    for ch in chunks:
        current: list[House] = []
        for h in ch:
            trial = current + [h]
            msg = build_fhl_message(
                req, trial, include_default_parties_at_top=include_default_parties_at_top
            )
            if len(msg) <= max_chars_per_file:
                current.append(h)
            elif not current:
                # single house is too big - still output it as-is
                messages.append(
                    build_fhl_message(
                        req, [h], include_default_parties_at_top=include_default_parties_at_top
                    )
                )
            else:
                messages.append(
                    build_fhl_message(
                        req, current, include_default_parties_at_top=include_default_parties_at_top
                    )
                )
                current = [h]
        if current:
            messages.append(
                build_fhl_message(
                    req, current, include_default_parties_at_top=include_default_parties_at_top
                )
            )

    return messages


def write_fhl_files(
    messages: list[str],
    out_dir: str,
    base_name: str = "FHL",
) -> list[str]:
    """
    Writes N messages into out_dir:
      FHL_001.txt, FHL_002.txt, ...
    Returns list of file paths.
    """
    os.makedirs(out_dir, exist_ok=True)  # noqa: PTH103
    paths: list[str] = []
    pad = max(3, len(str(len(messages))))
    for i, msg in enumerate(messages, start=1):
        fn = f"{base_name}_{str(i).zfill(pad)}.txt"
        path = os.path.join(out_dir, fn)  # noqa: PTH118
        with open(path, "w", encoding="utf-8") as f:
            f.write(msg)
        paths.append(path)
    return paths


# ----------------------------
# Convenience: build request from plain dict/json
# ----------------------------


def party_from_dict(d: dict[str, Any] | None) -> Party | None:
    if not d:
        return None
    return Party(
        name=d.get("name"),
        address=d.get("address"),
        location=d.get("location"),
        country=d.get("country"),
        postal=d.get("postal"),
        phone=d.get("phone"),
        fax=d.get("fax"),
        telex=d.get("telex"),
        email=d.get("email"),
    )


def request_from_dict(payload: dict[str, Any]) -> FHLRequest:
    m = payload["master"]
    master = Master(
        mawb=m["mawb"],
        origin=m["origin"],
        destination=m["destination"],
        total_pieces=int(m["total_pieces"]),
        total_weight=float(m["total_weight"]),
        weight_unit=m.get("weight_unit", "K"),
        flight_no=m.get("flight_no"),
        flight_date=m.get("flight_date"),
        currency=m.get("currency", "USD"),
        prepaid_collect=m.get("prepaid_collect", "PP"),
        dv_carriage=m.get("dv_carriage", "NVD"),
        dv_customs=m.get("dv_customs", "NCV"),
        dv_insurance=m.get("dv_insurance", "XXX"),
    )

    default_shipper = party_from_dict(payload.get("default_shipper"))
    default_consignee = party_from_dict(payload.get("default_consignee"))

    houses: list[House] = []
    for h in payload.get("houses", []):
        houses.append(
            House(
                hwb=h["hwb"],
                origin=h.get("origin", master.origin),
                destination=h.get("destination", master.destination),
                pieces=int(h["pieces"]),
                weight=float(h["weight"]),
                weight_unit=h.get("weight_unit", master.weight_unit),
                nature=h.get("nature"),
                goods_desc=h.get("goods_desc"),
                txt_lines=h.get("txt_lines"),
                shipper=party_from_dict(h.get("shipper")),
                consignee=party_from_dict(h.get("consignee")),
            )
        )

    return FHLRequest(
        master=master,
        houses=houses,
        default_shipper=default_shipper,
        default_consignee=default_consignee,
    )


# DATA INPUT EXAMPLE (for testing only)
# --------------------------------------------
# payload = {
#   "master": {
#     "mawb": "618-12345675",
#     "origin": "SIN",
#     "destination": "JFK",
#     "total_pieces": 7,
#     "total_weight": 1000,
#     "weight_unit": "K",
#     "currency": "SGD",
#     "prepaid_collect": "PP",
#     "dv_carriage": "NVD",
#     "dv_customs": "NCV",
#     "dv_insurance": "XXX"
#   },

#   # Optional default (kalau shipper/consignee sama)
#   "default_shipper": {
#     "name": "AIR EXPRESS INTL",
#     "address": "CARGO COMPLEX BLDG B",
#     "location": "AIRLINES ROAD",
#     "country": "SG",
#     "postal": "1738",
#     "fax": "651234567"
#   },
#   "default_consignee": {
#     "name": "AIE EXPRESS INTL",
#     "address": "CENTRAL STREET 13",
#     "location": "JAMAICA/NY",
#     "country": "US",
#     "postal": "22330",
#     "phone": "171812344566"
#   },

#   "houses": [
#     {
#       "hwb": "AEI12345678",
#       "origin": "SIN",
#       "destination": "JFK",
#       "pieces": 1,
#       "weight": 400,
#       "goods_desc": "COMPUTER PARTS",
#       "txt_lines": ["MODEL 3 MEMORY BOARDS AND OTHER ASSORTED PARTS"]
#       # shipper/consignee kosong -> pakai default (kalau Anda taruh default di top)
#     },
#     {
#       "hwb": "AEI99999999",
#       "origin": "SIN",
#       "destination": "JFK",
#       "pieces": 2,
#       "weight": 120,
#       "goods_desc": "GARMENTS",
#       "shipper": {   # override per house
#         "name": "DEF TEXTILE CO",
#         "address": "INDUSTRIAL ZONE 4",
#         "location": "BATAM",
#         "country": "ID",
#         "postal": "29433",
#         "phone": "0778123456"
#       },
#       "consignee": {
#         "name": "US FASHION LLC",
#         "address": "5TH AVENUE",
#         "location": "NEW YORK/NY",
#         "country": "US",
#         "postal": "10001",
#         "phone": "17185559876"
#       }
#     }
#   ]
# }
# --------------------------------------------

# Cara pakai: generate dan split jadi banyak file
# from fhl_generator import request_from_dict, split_houses, write_fhl_files

# req = request_from_dict(payload)

# # Split: max 80 house per file (default)
# messages = split_houses(
#     req,
#     max_houses_per_file=80,
#     max_chars_per_file=15000,              # optional: batasi panjang message
#     include_default_parties_at_top=True    # default shipper/consignee ditulis sekali di top
# )

# paths = write_fhl_files(messages, out_dir="./out_fhl", base_name="FHL")
# print("Generated:", paths)

# Catatan penting soal default vs per-house
# Kalau Anda set include_default_parties_at_top=True:
# default SHP/CNE ditulis sekali sebelum daftar house (consol-style)
# house yang punya shipper/consignee sendiri tetap akan muncul di bawah HBS (override)
# Kalau Anda mau default ikut muncul per house (lebih verbose), tinggal uncomment bagian fallback di build_fhl_message().
