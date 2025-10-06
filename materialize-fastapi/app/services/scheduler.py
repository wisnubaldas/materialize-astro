# app/services/scheduler.py
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.db.redis_conn import get_redis
from app.services.monitor_service import run_monitor_job

# Tips anti tabrakan:
#  - job_defaults.max_instances=1 => tidak tumpuk
#  - coalesce=True => jika beberapa jadwal terlewat, hanya eksekusi sekali
#  - misfire_grace_time => toleransi jika event loop sibuk
job_defaults = {
    "coalesce": True,
    "max_instances": 1,
    "misfire_grace_time": 120,  # detik
}


def init_scheduler(*, engine):
    sched = AsyncIOScheduler(job_defaults=job_defaults, timezone="Asia/Jakarta")
    rds = get_redis()

    # ambil filter tanggal dari ENV (atau set default untuk demo)
    date_of_flight = os.getenv("DATE_OF_FLIGHT", "2023-01-03")

    sched.add_job(
        run_monitor_job,
        trigger=IntervalTrigger(minutes=5),
        kwargs={"engine": engine, "rds": rds, "date_of_flight": date_of_flight},
        id="monitor_imp_breakdown",
        max_instances=1,  # per-job ensure
        replace_existing=True,
    )
    return sched
