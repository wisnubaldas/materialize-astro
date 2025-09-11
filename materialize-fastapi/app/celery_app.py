from celery import Celery

celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    # include=["app.tasks.task_angkasapura"],
)
celery_app.conf.update(
    timezone="Asia/Jakarta",
    enable_utc=True,
)
# Auto-discover semua task di dalam app.tasks.*
celery_app.autodiscover_tasks(["app.tasks"])

celery_app.conf.beat_schedule = {
    "sync-invoice-every-5min": {
        "task": "sync-data-invoice",
        "schedule": 300,  # 5 menit
    },
}