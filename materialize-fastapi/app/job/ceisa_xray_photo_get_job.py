"""Background job runner untuk get foto X-Ray CEISA."""

import logging

from app.db.mysql import SessionDB1W
from app.integrations.ceisa.client import CeisaClientService
from app.integrations.ceisa.log_service import CeisaLogService
from app.integrations.ceisa.oauth import CeisaOAuthService
from app.integrations.ceisa.xray_photo_get_service import CeisaXrayPhotoGetService
from app.repositories.ceisa_log_repository import CeisaLogRepository

logger = logging.getLogger("ceisa")


def run_ceisa_xray_photo_get_job(job_id: int) -> None:
    """Eksekusi background job get foto X-Ray dari CEISA."""
    with SessionDB1W() as db:
        log_service = CeisaLogService(CeisaLogRepository(db))
        oauth_service = CeisaOAuthService(log_service=log_service)
        client_service = CeisaClientService(
            oauth_service=oauth_service,
            log_service=log_service,
        )
        service = CeisaXrayPhotoGetService(db=db, client=client_service)
        try:
            service.process_job(job_id)
        except Exception:
            logger.exception("Job get foto X-Ray CEISA gagal untuk job_id=%s", job_id)


