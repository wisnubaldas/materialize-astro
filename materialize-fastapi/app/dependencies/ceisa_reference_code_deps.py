"""Dependency injection untuk master data referensi CEISA lintas kategori."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repository.ceisa_reference_code_repository import CeisaReferenceCodeRepository
from app.services.ceisa.reference_catalog_service import CeisaReferenceCatalogService
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
