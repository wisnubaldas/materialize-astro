import logging
from datetime.datetime import datetime

from app.celery_app import celery_app
from app.db.redis_lock import redis_lock
from app.services.inv_ap2_service import INVAp2Service

logger = logging.getLogger(__name__)


@celery_app.task(name="sync-data-invoice")
def sync_invoice():
    """
    Task Celery untuk sinkronisasi invoice AP2 setiap menit
    """
    with redis_lock("lock:sync-invoice", expire=600) as acquired:  # lock max 10 menit
        if not acquired:
            logger.info("[sync-data-invoice] Task sebelumnya masih jalan, skip...")
            return
    logger.info("[sync-data-invoice] Mulai proses...")
    now = datetime.now()
    INVAp2Service.send_invoice_sync(now.strftime("%Y-%m-%d"))
    logger.info("[sync-data-invoice] Selesai.")


@celery_app.task(name="inv-to-invap2")
def inv_to_invap2():
    """
    Task Celery untuk sinkronisasi invoice AP2 setiap 30 menit
    """
    with redis_lock("lock:inv-to-invap2", expire=600) as acquired:  # lock max 10 menit
        if not acquired:
            logger.info("[inv-to-invap2] Task sebelumnya masih jalan, skip...")
            return
    logger.info("[inv-to-invap2] Mulai proses...")
    INVAp2Service.get_data_inv()
    logger.info("[inv-to-invap2] Selesai.")
