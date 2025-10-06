# app/services/monitor_service.py
import json
from datetime import datetime
from typing import Any

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.utils.helper import HELPER

CHANNEL_NAME = "monitor:imp_breakdown"  # SSE akan dengar channel ini
LOCK_KEY = "lock:monitor:imp_breakdown"  # Redis lock key


# --- Query dasar (bisa kamu parametrisasi tanggal via job args/env) ---
query = HELPER.load_sql_query("app/services/query/get_imp_hubnet.sql")
SQL_IMP = text(query)


async def acquire_lock(rds: Redis, ttl_seconds: int = 600) -> bool:
    # SET NX + EX (TTL) untuk hindari deadlock jika job mati mendadak
    # Return True jika lock berhasil didapat
    return await rds.set(LOCK_KEY, "1", nx=True, ex=ttl_seconds) is True


async def release_lock(rds: Redis) -> None:
    await rds.delete(LOCK_KEY)


def fetch_data(engine: Engine, date_of_flight: str) -> list[dict[str, Any]]:
    with engine.connect() as conn:
        rows = conn.execute(SQL_IMP, {"date_of_flight": date_of_flight}).mappings().all()
        return [dict(r) for r in rows]


async def publish_snapshot(rds: Redis, payload: dict[str, Any]) -> None:
    # Ringkas: kirim JSON sekali per run; boleh juga pecah per-item jika mau streaming granular
    await rds.publish(CHANNEL_NAME, json.dumps(payload))


async def run_monitor_job(*, engine: Engine, rds: Redis, date_of_flight: str) -> None:
    # Lock untuk memastikan single-run even across multiple app instances
    got = await acquire_lock(rds)
    if not got:
        # Ada instance lain yang sedang running, biarkan saja
        return
    try:
        data = fetch_data(engine, date_of_flight)
        # Contoh agregasi ringan untuk dashboard:
        total_records = len(data)
        total_weight = sum(float(d.get("Weight") or 0) for d in data)
        total_netto = sum(float(d.get("Netto") or 0) for d in data)

        payload = {
            "ts": datetime.utcnow().isoformat() + "Z",  # noqa: DTZ003
            "filters": {"DateOfFlight": date_of_flight},
            "stats": {
                "total_records": total_records,
                "total_weight": total_weight,
                "total_netto": total_netto,
            },
            "sample": data[:20],  # batasi contoh agar SSE hemat (opsional)
        }
        await publish_snapshot(rds, payload)
    finally:
        await release_lock(rds)
