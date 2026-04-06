from apscheduler.schedulers.asyncio import AsyncIOScheduler
import pytz

from app.job.get_imp_breakdown_hubnet_job import run_breakdown
from app.job.get_inc_hubnet import run_incoming
from app.job.invoice_daily_counter_job import run_invoice_daily_counter_sync

# from app.job.get_out_hubnet import run_outgoings
from app.job.sending_ke_hubnet_job import run_sending_ke_hubnet
from app.services.angkasapura_service import INVAp2Service
from app.utils.env import ENV

scheduler = AsyncIOScheduler()
jakarta_tz = pytz.timezone("Asia/Jakarta")


def init_scheduler():
    scheduler.add_job(
        run_sending_ke_hubnet,
        "interval",
        minutes=20,
        id="sending_ke_hubnet_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=True,  # gabungkan job yang terlewat jika tertunda
        misfire_grace_time=30,
        kwargs={"limit": ENV.HUBNET_BATCH_LIMIT, "use_dev_url": False},
    )
    # scheduler.add_job(
    #     run_outgoing,
    #     "interval",
    #     minutes=60,
    #     id="run_outgoing_job",
    #     max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
    #     coalesce=True,  # gabungkan job yang terlewat jika tertunda
    #     misfire_grace_time=30,
    # )
    # tarik data untuk di sending
    scheduler.add_job(
        run_breakdown,
        "interval",
        minutes=30,
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
        minutes=60,
        id="get_data_inv_job",
        max_instances=1,
        coalesce=False,
        misfire_grace_time=None,
        replace_existing=True,
    )
    scheduler.add_job(
        run_invoice_daily_counter_sync,
        "cron",
        hour=23,
        minute=55,
        timezone=jakarta_tz,
        id="invoice_daily_counter_sync_job",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600,
        replace_existing=True,
    )
    scheduler.add_job(
        INVAp2Service.send_invoice,
        "interval",
        minutes=10,
        id="send_invoice_job",
        max_instances=1,  # 👈 hanya 1 instance yang boleh berjalan
        coalesce=False,
        misfire_grace_time=None,
        replace_existing=True,
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
