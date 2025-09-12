import datetime

from app.celery_app import celery_app
from app.services.inv_ap2_service import INVAp2Service
from app.db.redis_lock import redis_lock
@celery_app.task(name="sync-data-invoice")
def sync_invoice():
    """
    Task Celery untuk sinkronisasi invoice AP2 setiap menit
    """
    with redis_lock("lock:sync-invoice", expire=600) as acquired:  # lock max 10 menit
        if not acquired:
            print("[sync-data-invoice] Task sebelumnya masih jalan, skip...")
            return
    print("[sync-data-invoice] Mulai proses...")
    now = datetime.datetime.now()
    INVAp2Service.send_invoice_sync(now.strftime("%Y-%m-%d"))
    print("[sync-data-invoice] Selesai.")
    