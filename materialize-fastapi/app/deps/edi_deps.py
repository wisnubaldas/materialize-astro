from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db2_r
from app.repository.edi_repository import EdiRepository
from app.services.edi_service import EdiService


def _build_repo(db: Session) -> EdiRepository:
    return EdiRepository(db)


def get_buildup_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_buildup_service(repo: EdiRepository = Depends(get_buildup_repo)) -> EdiService:
    return EdiService(repo)


def get_weighing_header_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_weighing_header_service(repo: EdiRepository = Depends(get_weighing_header_repo)) -> EdiService:
    return EdiService(repo)
