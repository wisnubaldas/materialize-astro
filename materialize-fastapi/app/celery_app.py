# harus paling atas
from app.utils.logging_config import setup_logging

from celery.schedules import crontab
from celery import Celery
setup_logging()

celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    # include=["app.tasks.task_angkasapura"],
)
celery_app.conf.update(
    timezone="Asia/Jakarta",
    enable_utc=True,
    # Pakai Redis untuk schedule beat
    beat_scheduler="redbeat.RedBeatScheduler",
    redbeat_redis_url="redis://localhost:6379/1",   # bisa pakai DB redis lain biar terpisah
    redbeat_lock_key="redbeat::lock",               # kunci lock biar nggak dobel
)
# Auto-discover semua task di dalam app.tasks.*
celery_app.autodiscover_tasks(["app.tasks"])

celery_app.conf.beat_schedule = {
    "sync-invoice-every-1min": {
        "task": "sync-data-invoice",
        "schedule": crontab(minute="*"),  # 1 menit
    },
    "sync-invoice-every-30min": {
        "task": "inv-to-invap2",
        "schedule": crontab(minute="30"),  # 30 menit
    },
}