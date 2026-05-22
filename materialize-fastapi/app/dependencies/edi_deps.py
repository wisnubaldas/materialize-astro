from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w, get_db2_r
from app.repositories.edi_repository import EdiRepository
from app.services.edi_service import EdiService


def _build_repo(db: Session, legacy_db: Session | None = None) -> EdiRepository:
    return EdiRepository(db=db, legacy_db=legacy_db)



def get_weighing_header_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_weighing_header_service(
    repo: EdiRepository = Depends(get_weighing_header_repo),
) -> EdiService:
    return EdiService(repo)


def get_masterwaybill_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_masterwaybill_service(repo: EdiRepository = Depends(get_masterwaybill_repo)) -> EdiService:
    return EdiService(repo)



def get_fwb_repo_r(db: Session = Depends(get_db1_r)) -> EdiRepository:
    return _build_repo(db)


def get_fwb_repo_w(db: Session = Depends(get_db1_w)) -> EdiRepository:
    return _build_repo(db)


def get_fwb_service_r(repo: EdiRepository = Depends(get_fwb_repo_r)) -> EdiService:
    return EdiService(repo)


def get_fwb_service_w(repo: EdiRepository = Depends(get_fwb_repo_w)) -> EdiService:
    return EdiService(repo)


def get_ffm_build_up_repo(
    db: Session = Depends(get_db1_r),
    legacy_db: Session = Depends(get_db2_r),
) -> EdiRepository:
    """Create repository for FFM data from mobile Build Up Check + legacy fallback."""
    return _build_repo(db=db, legacy_db=legacy_db)


def get_ffm_build_up_service(
    repo: EdiRepository = Depends(get_ffm_build_up_repo),
) -> EdiService:
    return EdiService(repo)

