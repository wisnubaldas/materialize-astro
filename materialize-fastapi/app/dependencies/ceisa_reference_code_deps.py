"""Dependency injection untuk master data referensi CEISA lintas kategori."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repositories.ceisa_log_repository import CeisaLogRepository
from app.repositories.ceisa_reference_code_repository import CeisaReferenceCodeRepository
from app.integrations.ceisa.log_service import CeisaLogService
from app.integrations.ceisa.oauth import CeisaOAuthService
from app.integrations.ceisa.reference_catalog import CeisaReferenceCatalogService
from app.integrations.ceisa.sync_job import CeisaSyncJobService
from app.services.ceisa_reference_code_service import CeisaReferenceCodeService


def get_ceisa_reference_code_repo_r(
    db: Session = Depends(get_db1_r),
) -> CeisaReferenceCodeRepository:
    """Dependency repository read DB1."""
    return CeisaReferenceCodeRepository(db)


def get_ceisa_reference_code_repo_w(
    db: Session = Depends(get_db1_w),
) -> CeisaReferenceCodeRepository:
    """Dependency repository write DB1."""
    return CeisaReferenceCodeRepository(db)


def get_ceisa_reference_catalog_service() -> CeisaReferenceCatalogService:
    """Dependency parser catalog referensi CEISA."""
    return CeisaReferenceCatalogService()


def get_ceisa_reference_code_service_r(
    repo: CeisaReferenceCodeRepository = Depends(get_ceisa_reference_code_repo_r),
    catalog_service: CeisaReferenceCatalogService = Depends(get_ceisa_reference_catalog_service),
) -> CeisaReferenceCodeService:
    """Dependency service read."""
    return CeisaReferenceCodeService(repo, catalog_service)


def get_ceisa_reference_code_service_w(
    repo: CeisaReferenceCodeRepository = Depends(get_ceisa_reference_code_repo_w),
    catalog_service: CeisaReferenceCatalogService = Depends(get_ceisa_reference_catalog_service),
) -> CeisaReferenceCodeService:
    """Dependency service write."""
    return CeisaReferenceCodeService(repo, catalog_service)


def get_ceisa_sync_job_service_w(
    db: Session = Depends(get_db1_w),
    catalog_service: CeisaReferenceCatalogService = Depends(get_ceisa_reference_catalog_service),
) -> CeisaSyncJobService:
    """Dependency service write untuk enqueue/status job sinkronisasi CEISA."""
    return CeisaSyncJobService(db=db, catalog_service=catalog_service)


def get_ceisa_oauth_service_w(
    db: Session = Depends(get_db1_w),
) -> CeisaOAuthService:
    """Dependency OAuth2 service CEISA dengan dukungan request logging."""
    log_service = CeisaLogService(CeisaLogRepository(db))
    return CeisaOAuthService(log_service=log_service)

