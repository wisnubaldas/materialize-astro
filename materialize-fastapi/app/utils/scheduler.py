# app/core/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.tasks.get_imp_breakdown_hubnet_job import run_breakdown
from app.tasks.get_inc_hubnet import run_incoming

# from app.tasks.fibonacci_job import publish_fibonacci
# from app.tasks.math_job import (
#     publish_aritmetika,
#     publish_faktorial,
#     publish_geometri,
#     publish_pangkat,
# )

scheduler = AsyncIOScheduler()


def init_scheduler():
    scheduler.add_job(
        run_breakdown,
        "interval",
        minutes=60,
        id="breakdown_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
    )
    scheduler.add_job(
        run_incoming,
        "interval",
        minutes=60,
        id="run_incoming_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
    )
    # scheduler.add_job(publish_fibonacci, "interval", seconds=3, id="fibonacci_job")
    # scheduler.add_job(publish_aritmetika, "interval", seconds=4, id="arithmetic_job")
    # scheduler.add_job(publish_geometri, "interval", seconds=5, id="geometric_job")
    # scheduler.add_job(publish_pangkat, "interval", seconds=6, id="power_job")
    # scheduler.add_job(publish_faktorial, "interval", seconds=7, id="factorial_job")


async def start_scheduler():
    if not scheduler.running:
        init_scheduler()
        scheduler.start()
        print("✅ APScheduler started")


async def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("🛑 APScheduler stopped")
