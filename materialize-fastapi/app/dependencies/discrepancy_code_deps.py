from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.repository.discrepancy_code_repository import DiscrepancyCodeRepository
from app.services.discrepancy_code_service import DiscrepancyCodeService


def get_discrepancy_code_repo(db: Session = Depends(get_db1_r)) -> DiscrepancyCodeRepository:
    return DiscrepancyCodeRepository(db)


def get_discrepancy_code_service(
    repo: DiscrepancyCodeRepository = Depends(get_discrepancy_code_repo),
) -> DiscrepancyCodeService:
    return DiscrepancyCodeService(repo)
