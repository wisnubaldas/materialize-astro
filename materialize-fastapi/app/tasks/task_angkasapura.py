from ast import In
from app.celery_app import celery_app
from app.services.inv_ap2_service import INVAp2Service
@celery_app.task(name="sync-data-invoice")
def sync_invoice():
    INVAp2Service.get_data_inv()