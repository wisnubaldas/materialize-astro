"""Dependency injection untuk master data referensi asal barang CEISA."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repositories.ceisa_log_repository import CeisaLogRepository
from app.repositories.ceisa_reference_origin_goods_repository import (
    CeisaReferenceOriginGoodsRepository,
)
from app.integrations.ceisa.client import CeisaClientService
from app.integrations.ceisa.log_service import CeisaLogService
from app.integrations.ceisa.oauth import CeisaOAuthService
from app.integrations.ceisa.reference_code import CeisaReferenceCodeService
from app.services.ceisa_reference_origin_goods_service import CeisaReferenceOriginGoodsService


def get_ceisa_reference_origin_goods_repo_r(
    db: Session = Depends(get_db1_r),
) -> CeisaReferenceOriginGoodsRepository:
    """Dependency repository read DB1."""
    return CeisaReferenceOriginGoodsRepository(db)


def get_ceisa_reference_origin_goods_repo_w(
    db: Session = Depends(get_db1_w),
) -> CeisaReferenceOriginGoodsRepository:
    """Dependency repository write DB1."""
    return CeisaReferenceOriginGoodsRepository(db)


def get_ceisa_client_service(
    db: Session = Depends(get_db1_w),
) -> CeisaClientService:
    """Dependency client CEISA."""
    log_service = CeisaLogService(CeisaLogRepository(db))
    oauth_service = CeisaOAuthService(log_service=log_service)
    return CeisaClientService(
        oauth_service=oauth_service,
        log_service=log_service,
    )


def get_ceisa_reference_code_service(
    client: CeisaClientService = Depends(get_ceisa_client_service),
) -> CeisaReferenceCodeService:
    """Dependency service reference code CEISA."""
    return CeisaReferenceCodeService(client)


def get_ceisa_reference_origin_goods_service_r(
    repo: CeisaReferenceOriginGoodsRepository = Depends(get_ceisa_reference_origin_goods_repo_r),
    ceisa_reference_service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service),
) -> CeisaReferenceOriginGoodsService:
    """Dependency service read."""
    return CeisaReferenceOriginGoodsService(repo, ceisa_reference_service)


def get_ceisa_reference_origin_goods_service_w(
    repo: CeisaReferenceOriginGoodsRepository = Depends(get_ceisa_reference_origin_goods_repo_w),
    ceisa_reference_service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service),
) -> CeisaReferenceOriginGoodsService:
    """Dependency service write."""
    return CeisaReferenceOriginGoodsService(repo, ceisa_reference_service)

