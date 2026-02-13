from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repository.discrepancy_code_repository import DiscrepancyCodeRepository
from app.services.discrepancy_code_service import DiscrepancyCodeService


def get_discrepancy_code_repo_r(db: Session = Depends(get_db1_r)) -> DiscrepancyCodeRepository:
    return DiscrepancyCodeRepository(db)


def get_discrepancy_code_repo_w(db: Session = Depends(get_db1_w)) -> DiscrepancyCodeRepository:
    return DiscrepancyCodeRepository(db)


def get_discrepancy_code_service(
    repo: DiscrepancyCodeRepository = Depends(get_discrepancy_code_repo_r),
) -> DiscrepancyCodeService:
    return DiscrepancyCodeService(repo)


def get_discrepancy_code_service_r(
    repo: DiscrepancyCodeRepository = Depends(get_discrepancy_code_repo_r),
) -> DiscrepancyCodeService:
    return DiscrepancyCodeService(repo)


def get_discrepancy_code_service_w(
    repo: DiscrepancyCodeRepository = Depends(get_discrepancy_code_repo_w),
) -> DiscrepancyCodeService:
    return DiscrepancyCodeService(repo)
