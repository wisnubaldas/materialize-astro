from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_w
from app.repositories.build_up_check_repository import BuildUpCheckRepository
from app.services.build_up_check_service import BuildUpCheckService


def get_build_up_check_repo(db: Session = Depends(get_db1_w)) -> BuildUpCheckRepository:
    """Create repository for mobile Build Up Check write database access."""
    return BuildUpCheckRepository(db)


def get_build_up_check_service(
    repo: BuildUpCheckRepository = Depends(get_build_up_check_repo),
) -> BuildUpCheckService:
    """Create service for mobile Build Up Check flow."""
    return BuildUpCheckService(repo)
