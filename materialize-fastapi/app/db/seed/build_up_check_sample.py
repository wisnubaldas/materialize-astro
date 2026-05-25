from dataclasses import dataclass
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.BaseDB1.build_up_check_detail import BuildUpCheckDetail
from app.models.BaseDB1.build_up_check_header import BuildUpCheckHeader
from app.models.BaseDB1.build_up_check_rincian import BuildUpCheckRincian
from app.models.BaseDB2.eks_buildupdetail import EksBuildupDetail
from app.models.BaseDB2.eks_buildupheader import EksBuildupHeader

SOURCE_BUILDUP_NUMBER = "BGD1.CME.20.00369"
LEGACY_SAMPLE_ULDS = [
    "PMC81001GA",
    "PMC81002GA",
    "AKE81003GA",
    "AKE81004GA",
]
FX_SAMPLE_ULDS = [
    "AKE93001FX",
    "AKE93002FX",
    "AKE93003FX",
    "PMC93004FX",
    "PMC93005FX",
]


@dataclass(frozen=True)
class FxDetailSample:
    """Payload for one FX Build Up Check detail sample."""

    mawb: str
    rincian: list[tuple[int, float]]
    master_total_pieces: int
    remark: str
    split_group_key: str | None = None
    split_sequence: int | None = None
    split_total_uld: int = 1


def _clean_text(value: object) -> str | None:
    """Normalize string values from legacy DB2 rows.

    Args:
        value: Raw value from DB2 or local model.

    Returns:
        Trimmed string, or None when empty.
    """
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_uld(value: object) -> str:
    """Normalize legacy ULD card text into one compact identifier.

    Args:
        value: Legacy ULD card number, for example ``PAG 5940 DHL``.

    Returns:
        Uppercase compact ULD identifier, for example ``PAG5940DHL``.
    """
    text = _clean_text(value) or "BULK"
    return "".join(ch for ch in text.upper() if ch.isalnum())


def _parse_date(value: object) -> date | None:
    """Parse DB2 date text safely.

    Args:
        value: Date value or string from legacy DB2.

    Returns:
        Parsed date, or None when the value is not parseable.
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    text = _clean_text(value)
    if not text:
        return None
    for candidate in (text[:10], text):
        try:
            return date.fromisoformat(candidate)
        except ValueError:
            continue
    return None


def _parse_int(*values: object) -> int | None:
    """Return the first positive integer from candidate values."""
    for value in values:
        if value is None:
            continue
        try:
            parsed = int(float(str(value).strip()))
        except (TypeError, ValueError):
            continue
        if parsed > 0:
            return parsed
    return None


def _parse_float(*values: object) -> float | None:
    """Return the first positive float from candidate values."""
    for value in values:
        if value is None:
            continue
        try:
            parsed = float(str(value).strip())
        except (TypeError, ValueError):
            continue
        if parsed > 0:
            return parsed
    return None


def _build_flight_no(header: EksBuildupHeader) -> str | None:
    """Combine airline and flight number for the DB1 Build Up header.

    Args:
        header: Legacy buildup header from DB2.

    Returns:
        Flight number with carrier prefix when possible.
    """
    carrier = (_clean_text(header.airlines_code) or "").upper()
    flight_number = (_clean_text(header.flight_number) or "").upper()
    if carrier and flight_number and not flight_number.startswith(carrier):
        return f"{carrier}{flight_number}"
    return flight_number or None


def _destination_from_legacy(value: object) -> str | None:
    """Extract destination airport from legacy route text.

    Args:
        value: Destination or route code from DB2, for example ``CGKSIN``.

    Returns:
        Last three-letter airport code when route text is present.
    """
    text = "".join(ch for ch in (_clean_text(value) or "").upper() if ch.isalnum())
    if len(text) >= 6:
        return text[-3:]
    return text or None


def _fetch_legacy_source(
    legacy_db: Session,
) -> tuple[EksBuildupHeader, dict[str, list[EksBuildupDetail]]]:
    """Fetch one real DB2 buildup and group details by ULD.

    Args:
        legacy_db: DB2 read-only SQLAlchemy session.

    Returns:
        Legacy header and grouped legacy detail rows.

    Raises:
        LookupError: If source buildup data is not available in DB2.
    """
    header = (
        legacy_db.query(EksBuildupHeader)
        .filter(
            EksBuildupHeader.buildup_number == SOURCE_BUILDUP_NUMBER,
            EksBuildupHeader.void.is_(False),
        )
        .first()
    )
    if not header:
        raise LookupError(f"DB2 buildup {SOURCE_BUILDUP_NUMBER} tidak ditemukan.")

    details = (
        legacy_db.query(EksBuildupDetail)
        .filter(
            EksBuildupDetail.buildup_number == SOURCE_BUILDUP_NUMBER,
            EksBuildupDetail.void.is_(False),
            EksBuildupDetail.master_awb.isnot(None),
            EksBuildupDetail.master_awb != "",
            EksBuildupDetail.uld_card_number.isnot(None),
            EksBuildupDetail.uld_card_number != "",
        )
        .order_by(EksBuildupDetail.uld_card_number.asc(), EksBuildupDetail.noid.asc())
        .all()
    )
    grouped_details: dict[str, list[EksBuildupDetail]] = {}
    for detail in details:
        grouped_details.setdefault(_normalize_uld(detail.uld_card_number), []).append(detail)

    if not grouped_details:
        raise LookupError(f"DB2 buildup {SOURCE_BUILDUP_NUMBER} tidak memiliki detail ULD.")
    return header, grouped_details


def _delete_existing_samples(db: Session, ulds: list[str]) -> int:
    """Remove previous sample rows from DB1 before reseeding.

    Args:
        db: DB1 write session.
        ulds: Current DB2-driven sample ULD identifiers.

    Returns:
        Number of deleted Build Up Check headers.
    """
    target_ulds = sorted({*LEGACY_SAMPLE_ULDS, *FX_SAMPLE_ULDS, *ulds})
    headers = (
        db.query(BuildUpCheckHeader)
        .filter(BuildUpCheckHeader.uld.in_(target_ulds))
        .all()
    )
    deleted_count = len(headers)
    for header in headers:
        db.delete(header)
    db.flush()
    return deleted_count


def _create_fx_header(
    db: Session,
    uld: str,
    flight_no: str,
    dest: str,
    flight_date: date,
) -> BuildUpCheckHeader:
    """Create one FX Build Up Check sample header.

    Args:
        db: DB1 write session.
        uld: ULD identifier.
        flight_no: FX flight number.
        dest: Destination airport code.
        flight_date: Flight date.

    Returns:
        Created BuildUpCheckHeader row.
    """
    header = BuildUpCheckHeader(
        uld=uld,
        airlines="FX",
        flight_no=flight_no,
        dest=dest,
        flight_date=flight_date,
        staff="FX SAMPLE STAFF",
        supervisor="FX SAMPLE SUPERVISOR",
    )
    db.add(header)
    db.flush()
    return header


def _create_fx_detail(
    db: Session,
    header: BuildUpCheckHeader,
    sample: FxDetailSample,
) -> BuildUpCheckDetail:
    """Create an FX MAWB detail with one or more rincian rows.

    Args:
        db: DB1 write session.
        header: Parent FX Build Up Check header.
        sample: Detail payload including MAWB, rincian, and split metadata.

    Returns:
        Created BuildUpCheckDetail row.
    """
    total_pieces = sum(item[0] for item in sample.rincian)
    now = datetime.now(timezone.utc)
    detail = BuildUpCheckDetail(
        header=header,
        mawb=sample.mawb,
        total_pieces=total_pieces,
        master_total_pieces=sample.master_total_pieces,
        split_group_key=sample.split_group_key,
        split_sequence=sample.split_sequence,
        split_total_uld=sample.split_total_uld,
        is_split_uld=bool(sample.split_group_key),
        is_allocation_final=True,
        allocation_closed_at=now,
        status=1,
        agent="FX CARGO SAMPLE",
        remark=sample.remark,
    )
    db.add(detail)
    db.flush()

    for pieces, weight in sample.rincian:
        db.add(
            BuildUpCheckRincian(
                check_detail_id=detail.id,
                pieces=pieces,
                weight=weight,
            )
        )
    return detail


def _insert_fx_samples(db: Session) -> dict[str, int | str]:
    """Insert FX-specific Build Up Check sample scenarios into DB1.

    Args:
        db: DB1 write session.

    Returns:
        Inserted row summary for FX sample data.
    """
    flight_date = date(2026, 5, 25)

    split_group = "FX6068|2026-05-25|023-93000011"
    split_header_1 = _create_fx_header(db, "AKE93001FX", "FX6068", "SIN", flight_date)
    split_header_2 = _create_fx_header(db, "AKE93002FX", "FX6068", "SIN", flight_date)
    _create_fx_detail(
        db=db,
        header=split_header_1,
        sample=FxDetailSample(
            mawb="023-93000011",
            rincian=[(8, 96.4)],
            master_total_pieces=20,
            remark="ELECTRONIC PARTS",
            split_group_key=split_group,
            split_sequence=1,
            split_total_uld=2,
        ),
    )
    _create_fx_detail(
        db=db,
        header=split_header_2,
        sample=FxDetailSample(
            mawb="023-93000011",
            rincian=[(12, 148.6)],
            master_total_pieces=20,
            remark="ELECTRONIC PARTS",
            split_group_key=split_group,
            split_sequence=2,
            split_total_uld=2,
        ),
    )

    multi_rincian_header = _create_fx_header(db, "AKE93003FX", "FX6068", "SIN", flight_date)
    _create_fx_detail(
        db=db,
        header=multi_rincian_header,
        sample=FxDetailSample(
            mawb="023-93000022",
            rincian=[(4, 42.5), (6, 65.25), (3, 31.75)],
            master_total_pieces=13,
            remark="MEDICAL SUPPLY",
        ),
    )

    split_multi_group = "FX5194|2026-05-26|023-93000033"
    split_multi_header_1 = _create_fx_header(db, "PMC93004FX", "FX5194", "SIN", date(2026, 5, 26))
    split_multi_header_2 = _create_fx_header(db, "PMC93005FX", "FX5194", "SIN", date(2026, 5, 26))
    _create_fx_detail(
        db=db,
        header=split_multi_header_1,
        sample=FxDetailSample(
            mawb="023-93000033",
            rincian=[(5, 74.2), (7, 102.8)],
            master_total_pieces=30,
            remark="GENERAL CARGO",
            split_group_key=split_multi_group,
            split_sequence=1,
            split_total_uld=2,
        ),
    )
    _create_fx_detail(
        db=db,
        header=split_multi_header_2,
        sample=FxDetailSample(
            mawb="023-93000033",
            rincian=[(6, 88.1), (8, 116.4), (4, 57.9)],
            master_total_pieces=30,
            remark="GENERAL CARGO",
            split_group_key=split_multi_group,
            split_sequence=2,
            split_total_uld=2,
        ),
    )

    return {
        "fx_inserted_headers": 5,
        "fx_inserted_details": 5,
        "fx_inserted_rincian": 8,
        "fx_primary_header_id": int(split_header_1.id),
    }


def _create_detail_from_legacy(
    db: Session,
    header: BuildUpCheckHeader,
    legacy_detail: EksBuildupDetail,
) -> BuildUpCheckDetail:
    """Create one DB1 Build Up Check detail from DB2 buildup detail.

    Args:
        db: DB1 write session.
        header: Parent DB1 Build Up Check header.
        legacy_detail: Source DB2 buildup detail.

    Returns:
        Created DB1 detail row.
    """
    pieces = _parse_int(legacy_detail.part_pieces, legacy_detail.pieces) or 1
    master_total_pieces = _parse_int(legacy_detail.pieces, legacy_detail.part_pieces) or pieces
    weight = _parse_float(legacy_detail.part_netto, legacy_detail.netto) or 0.0
    now = datetime.now(timezone.utc)
    detail = BuildUpCheckDetail(
        header=header,
        mawb=_clean_text(legacy_detail.master_awb),
        total_pieces=pieces,
        master_total_pieces=max(master_total_pieces, pieces),
        split_total_uld=1,
        is_split_uld=False,
        is_allocation_final=True,
        allocation_closed_at=now,
        status=1,
        agent=_clean_text(legacy_detail.agen_code),
        remark=_clean_text(legacy_detail.kind_of_good)
        or _clean_text(legacy_detail.remarks)
        or "DB2 BUILDUP SAMPLE",
    )
    db.add(detail)
    db.flush()
    db.add(
        BuildUpCheckRincian(
            check_detail_id=detail.id,
            pieces=pieces,
            weight=round(weight, 2),
        )
    )
    return detail


def seed_build_up_check_samples() -> dict[str, int | str]:
    """Insert DB2-driven Build Up Check sample data into DB1.

    Returns:
        Summary of source and inserted sample rows.
    """
    legacy_db: Session = SessionDB2R()
    db: Session = SessionDB1W()
    try:
        legacy_header, grouped_details = _fetch_legacy_source(legacy_db)
        sample_ulds = list(grouped_details.keys())
        deleted_headers = _delete_existing_samples(db, sample_ulds)

        inserted_headers = 0
        inserted_details = 0
        inserted_rincian = 0
        primary_header_id: int | None = None
        primary_uld = max(sample_ulds, key=lambda uld: len(grouped_details[uld]))

        for uld in sample_ulds:
            header = BuildUpCheckHeader(
                uld=uld,
                airlines=_clean_text(legacy_header.airlines_code),
                flight_no=_build_flight_no(legacy_header),
                dest=_destination_from_legacy(legacy_header.destination_code),
                flight_date=_parse_date(legacy_header.date_of_flight),
                staff=_clean_text(legacy_header.operator_name)
                or _clean_text(legacy_header.employee_number)
                or "DB2 SAMPLE",
                supervisor="DB2 FFM SAMPLE",
            )
            db.add(header)
            db.flush()
            inserted_headers += 1
            if uld == primary_uld:
                primary_header_id = int(header.id)

            for legacy_detail in grouped_details[uld]:
                _create_detail_from_legacy(db, header, legacy_detail)
                inserted_details += 1
                inserted_rincian += 1

        fx_summary = _insert_fx_samples(db)
        db.commit()
        return {
            "source_buildup": SOURCE_BUILDUP_NUMBER,
            "deleted_headers": deleted_headers,
            "inserted_headers": inserted_headers + int(fx_summary["fx_inserted_headers"]),
            "inserted_details": inserted_details + int(fx_summary["fx_inserted_details"]),
            "inserted_rincian": inserted_rincian + int(fx_summary["fx_inserted_rincian"]),
            "primary_uld": primary_uld,
            "primary_header_id": primary_header_id or 0,
            "fx_inserted_headers": fx_summary["fx_inserted_headers"],
            "fx_inserted_details": fx_summary["fx_inserted_details"],
            "fx_inserted_rincian": fx_summary["fx_inserted_rincian"],
            "fx_primary_header_id": fx_summary["fx_primary_header_id"],
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
        legacy_db.close()


def main() -> None:
    """Run the DB2-driven Build Up Check sample seeder from command line."""
    summary = seed_build_up_check_samples()
    print(
        "DB2 Build Up Check samples inserted from "
        f"{summary['source_buildup']}: "
        f"{summary['inserted_headers']} headers, "
        f"{summary['inserted_details']} details, "
        f"{summary['inserted_rincian']} rincian. "
        f"Primary ULD: {summary['primary_uld']} "
        f"(header id {summary['primary_header_id']}). "
        f"FX samples: {summary['fx_inserted_headers']} headers, "
        f"{summary['fx_inserted_details']} details, "
        f"{summary['fx_inserted_rincian']} rincian "
        f"(first FX header id {summary['fx_primary_header_id']}). "
        f"Deleted previous sample headers: {summary['deleted_headers']}."
    )


if __name__ == "__main__":
    main()
