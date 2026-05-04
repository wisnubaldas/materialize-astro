from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db3_r
from app.repositories.tpsonline_repository import TpsOnlineRepository
from app.services.tpsonline_service import TpsOnlineService


def get_tpsonline_repository(db: Session = Depends(get_db3_r)) -> TpsOnlineRepository:
    """Build TPS Online repository with DB3 read session."""
    return TpsOnlineRepository(db)


def get_tpsonline_service(
    repository: TpsOnlineRepository = Depends(get_tpsonline_repository),
) -> TpsOnlineService:
    """Build TPS Online service."""
    return TpsOnlineService(repository)
