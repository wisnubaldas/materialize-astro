"""Simple benchmark for Angkasapura dashboard query paths.

Usage:
  poetry run python scripts/benchmark_angkasapura_dashboard.py --year 2026 --month 3 --loops 10
"""

from __future__ import annotations

import argparse
import statistics
import time

from sqlalchemy import text

from app.db.mysql import SessionDB1R
from app.services.inv_ap2_service import INVAp2Service


def _run_case(label: str, loops: int, fn) -> None:
    samples: list[float] = []
    result_rows = 0
    for _ in range(loops):
        started_at = time.perf_counter()
        result = fn()
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        samples.append(elapsed_ms)
        result_rows = len(result)

    sorted_samples = sorted(samples)
    p95_index = max(int(len(sorted_samples) * 0.95) - 1, 0)
    p95 = sorted_samples[p95_index]

    print(
        f"{label}: "
        f"min={min(samples):.2f}ms "
        f"avg={statistics.fmean(samples):.2f}ms "
        f"p95={p95:.2f}ms "
        f"max={max(samples):.2f}ms "
        f"rows={result_rows}"
    )


def _print_explain(db, year: int) -> None:
    explain_sql = text(
        """
        EXPLAIN
        SELECT
          YEAR(COALESCE(
            STR_TO_DATE(TANGGAL, '%Y-%m-%d'),
            STR_TO_DATE(TANGGAL, '%Y-%m-%d %H:%i:%s'),
            STR_TO_DATE(TANGGAL, '%d-%m-%Y'),
            STR_TO_DATE(TANGGAL, '%d/%m/%Y'),
            STR_TO_DATE(TANGGAL, '%Y/%m/%d'),
            created_at
          )) AS year_val,
          MONTH(COALESCE(
            STR_TO_DATE(TANGGAL, '%Y-%m-%d'),
            STR_TO_DATE(TANGGAL, '%Y-%m-%d %H:%i:%s'),
            STR_TO_DATE(TANGGAL, '%d-%m-%Y'),
            STR_TO_DATE(TANGGAL, '%d/%m/%Y'),
            STR_TO_DATE(TANGGAL, '%Y/%m/%d'),
            created_at
          )) AS month_val,
          COUNT(id) AS total_sent
        FROM inv_ap2
        WHERE status = 1
          AND YEAR(COALESCE(
            STR_TO_DATE(TANGGAL, '%Y-%m-%d'),
            STR_TO_DATE(TANGGAL, '%Y-%m-%d %H:%i:%s'),
            STR_TO_DATE(TANGGAL, '%d-%m-%Y'),
            STR_TO_DATE(TANGGAL, '%d/%m/%Y'),
            STR_TO_DATE(TANGGAL, '%Y/%m/%d'),
            created_at
          )) = :year
        GROUP BY
          YEAR(COALESCE(
            STR_TO_DATE(TANGGAL, '%Y-%m-%d'),
            STR_TO_DATE(TANGGAL, '%Y-%m-%d %H:%i:%s'),
            STR_TO_DATE(TANGGAL, '%d-%m-%Y'),
            STR_TO_DATE(TANGGAL, '%d/%m/%Y'),
            STR_TO_DATE(TANGGAL, '%Y/%m/%d'),
            created_at
          )),
          MONTH(COALESCE(
            STR_TO_DATE(TANGGAL, '%Y-%m-%d'),
            STR_TO_DATE(TANGGAL, '%Y-%m-%d %H:%i:%s'),
            STR_TO_DATE(TANGGAL, '%d-%m-%Y'),
            STR_TO_DATE(TANGGAL, '%d/%m/%Y'),
            STR_TO_DATE(TANGGAL, '%Y/%m/%d'),
            created_at
          ))
        """
    )
    rows = db.execute(explain_sql, {"year": year}).fetchall()
    print("EXPLAIN:")
    for row in rows:
        print(dict(row._mapping))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--month", type=int, required=True)
    parser.add_argument("--loops", type=int, default=10)
    args = parser.parse_args()

    loops = args.loops if args.loops > 0 else 10

    db = SessionDB1R()
    try:
        row_count = db.execute(text("SELECT COUNT(*) FROM inv_ap2")).scalar()
        print(f"inv_ap2 rows={row_count}")

        _run_case(
            label="invoice_perbulan",
            loops=loops,
            fn=lambda: INVAp2Service.invoice_perbulan(db=db, tahun=args.year),
        )
        _run_case(
            label="invoice_perbulan_detail",
            loops=loops,
            fn=lambda: INVAp2Service.invoice_perbulan_detail(
                db=db,
                tahun=args.year,
                bulan=args.month,
            ),
        )
        _print_explain(db=db, year=args.year)
    finally:
        db.close()


if __name__ == "__main__":
    main()
