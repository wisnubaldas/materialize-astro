"""Dependency injection untuk modul kirim foto X-Ray CEISA."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_w
from app.integrations.ceisa.client import CeisaClientService
from app.integrations.ceisa.log_service import CeisaLogService
from app.integrations.ceisa.oauth import CeisaOAuthService
from app.integrations.ceisa.xray_photo_service import CeisaXrayPhotoService
from app.repository.ceisa_log_repository import CeisaLogRepository


def get_ceisa_client_service(
    db: Session = Depends(get_db1_w),
) -> CeisaClientService:
    """Dependency client CEISA untuk operasi kirim foto X-Ray."""
    log_service = CeisaLogService(CeisaLogRepository(db))
    oauth_service = CeisaOAuthService(log_service=log_service)
    return CeisaClientService(
        oauth_service=oauth_service,
        log_service=log_service,
    )


def get_ceisa_xray_photo_service_w(
    db: Session = Depends(get_db1_w),
    client: CeisaClientService = Depends(get_ceisa_client_service),
) -> CeisaXrayPhotoService:
    """Dependency service write untuk enqueue/proses kirim foto X-Ray."""
    return CeisaXrayPhotoService(db=db, client=client)

