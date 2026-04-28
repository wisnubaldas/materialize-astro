"""Background job runner untuk sinkronisasi referensi CEISA."""

import logging

from app.db.mysql import SessionDB1W
from app.integrations.ceisa.reference_catalog import CeisaReferenceCatalogService
from app.integrations.ceisa.sync_job import CeisaSyncJobService

logger = logging.getLogger("ceisa")


def run_ceisa_reference_sync_job(job_id: int) -> None:
    """Jalankan sinkronisasi referensi CEISA dari log job id tertentu."""
    with SessionDB1W() as db:
        service = CeisaSyncJobService(db=db, catalog_service=CeisaReferenceCatalogService())
        try:
            service.process_reference_sync_job(job_id)
        except Exception:
            logger.exception("CEISA sync job gagal untuk job_id=%s", job_id)
