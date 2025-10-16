# app/core/scheduler.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.inv_ap2_service import INVAp2Service
from app.tasks.get_imp_breakdown_hubnet_job import run_breakdown
from app.tasks.get_inc_hubnet import run_incoming
from app.tasks.get_out_hubnet import run_outgoing
from app.tasks.sending_ke_hubnet_job import run_sending_ke_hubnet
from app.utils.env import ENV

scheduler = AsyncIOScheduler()


def init_scheduler():
    print("Menjalankan job hubnet...")
    scheduler.add_job(
        run_sending_ke_hubnet,
        "interval",
        minutes=15,
        id="sending_ke_hubnet_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
        kwargs={"limit": ENV.HUBNET_BATCH_LIMIT, "use_dev_url": False},
    )
    scheduler.add_job(
        run_outgoing,
        "interval",
        minutes=60,
        id="run_outgoing_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
    )
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
    scheduler.add_job(
        INVAp2Service.get_data_inv,
        "interval",
        minutes=1,
        id="get_data_inv_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
    )
    scheduler.add_job(
        INVAp2Service.send_invoice,
        "interval",
        minutes=1,
        id="send_invoice_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
    )


async def start_scheduler():
    if not scheduler.running:
        print("✅ APScheduler started")
        init_scheduler()
        scheduler.start()


async def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("🛑 APScheduler stopped")
