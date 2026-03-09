from __future__ import annotations

import logging
from decimal import Decimal
from json import dumps

from sqlalchemy import Numeric, cast, func
from sqlalchemy.dialects.mysql import insert as mysql_insert

from app.db.mysql import SessionDB1R, SessionDB1W
from app.models.BaseDB1.inv_ap2 import InvAp2
from app.models.BaseDB1.invoice_daily_counter import InvoiceDailyCounter
from app.services.redis_service import publish_sync

CHANNEL_NAME = "invoice_daily_counter_channel"
logger = logging.getLogger("angkasapura")


def _normalized_invoice_date():
    return func.coalesce(
        func.str_to_date(InvAp2.TANGGAL, "%Y-%m-%d"),
        func.str_to_date(InvAp2.TANGGAL, "%Y-%m-%d %H:%i:%s"),
        func.str_to_date(InvAp2.TANGGAL, "%d-%m-%Y"),
        func.str_to_date(InvAp2.TANGGAL, "%d/%m/%Y"),
        func.str_to_date(InvAp2.TANGGAL, "%Y/%m/%d"),
        InvAp2.created_at,
    )


def _numeric_expr(column):
    normalized = func.replace(func.replace(func.trim(column), ",", ""), " ", "")
    safe_value = func.coalesce(func.nullif(normalized, ""), "0")
    return cast(safe_value, Numeric(18, 2))


def _to_decimal(value: Decimal | float | int | str | None) -> Decimal:
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def run_invoice_daily_counter_sync() -> None:
    logger.info("Mulai sinkronisasi invoice_daily_counter dari inv_ap2")
    publish_sync(
        CHANNEL_NAME,
        dumps(
            {
                "level": "info",
                "message": "Mulai sinkronisasi invoice_daily_counter dari inv_ap2",
            }
        ),
    )

    read_session = SessionDB1R()
    write_session = SessionDB1W()
    try:
        normalized_date = _normalized_invoice_date()
        tanggal_expr = func.date(normalized_date)

        rows = (
            read_session.query(
                tanggal_expr.label("tanggal"),
                func.count(InvAp2.id).label("jumlah_invoice"),
                func.coalesce(func.sum(_numeric_expr(InvAp2.KOLI)), 0).label("total_koli"),
                func.coalesce(func.sum(_numeric_expr(InvAp2.BERAT)), 0).label("total_berat"),
                func.coalesce(func.sum(_numeric_expr(InvAp2.VOLUME)), 0).label("total_volume"),
                func.coalesce(func.sum(_numeric_expr(InvAp2.TOTAL_PENDAPATAN_TANPA_PPN)), 0).label(
                    "total_pendapatan_tanpa_ppn"
                ),
                func.coalesce(func.sum(_numeric_expr(InvAp2.TOTAL_PENDAPATAN_DENGAN_PPN)), 0).label(
                    "total_pendapatan_dengan_ppn"
                ),
            )
            .group_by(tanggal_expr)
            .order_by(tanggal_expr.asc())
            .all()
        )

        payload = [
            {
                "tanggal": row.tanggal,
                "jumlah_invoice": int(row.jumlah_invoice or 0),
                "total_koli": _to_decimal(row.total_koli),
                "total_berat": _to_decimal(row.total_berat),
                "total_volume": _to_decimal(row.total_volume),
                "total_pendapatan_tanpa_ppn": _to_decimal(row.total_pendapatan_tanpa_ppn),
                "total_pendapatan_dengan_ppn": _to_decimal(row.total_pendapatan_dengan_ppn),
            }
            for row in rows
            if row.tanggal is not None
        ]

        if not payload:
            logger.info("Sinkronisasi invoice_daily_counter dilewati karena data inv_ap2 kosong")
            publish_sync(
                CHANNEL_NAME,
                dumps(
                    {
                        "level": "info",
                        "message": "Sinkronisasi invoice_daily_counter dilewati karena data inv_ap2 kosong",
                    }
                ),
            )
            return

        insert_stmt = mysql_insert(InvoiceDailyCounter).values(payload)
        upsert_stmt = insert_stmt.on_duplicate_key_update(
            jumlah_invoice=insert_stmt.inserted.jumlah_invoice,
            total_koli=insert_stmt.inserted.total_koli,
            total_berat=insert_stmt.inserted.total_berat,
            total_volume=insert_stmt.inserted.total_volume,
            total_pendapatan_tanpa_ppn=insert_stmt.inserted.total_pendapatan_tanpa_ppn,
            total_pendapatan_dengan_ppn=insert_stmt.inserted.total_pendapatan_dengan_ppn,
            updated_at=func.current_timestamp(),
        )

        write_session.execute(upsert_stmt)
        write_session.commit()

        logger.info(
            "Sinkronisasi invoice_daily_counter selesai. Baris agregat diproses: %s",
            len(payload),
        )
        publish_sync(
            CHANNEL_NAME,
            dumps(
                {
                    "level": "success",
                    "message": f"Sinkronisasi invoice_daily_counter selesai. Baris diproses: {len(payload)}",
                }
            ),
        )
    except Exception as exc:
        write_session.rollback()
        logger.exception("Sinkronisasi invoice_daily_counter gagal: %s", exc)
        publish_sync(
            CHANNEL_NAME,
            dumps(
                {
                    "level": "error",
                    "message": f"Sinkronisasi invoice_daily_counter gagal: {exc!s}",
                }
            ),
        )
    finally:
        read_session.close()
        write_session.close()
