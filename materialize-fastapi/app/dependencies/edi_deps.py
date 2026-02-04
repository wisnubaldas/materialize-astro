from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w, get_db2_r
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


def get_weighing_header_service(
    repo: EdiRepository = Depends(get_weighing_header_repo),
) -> EdiService:
    return EdiService(repo)


def get_masterwaybill_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_masterwaybill_service(repo: EdiRepository = Depends(get_masterwaybill_repo)) -> EdiService:
    return EdiService(repo)


def get_buildup_mawb_repo(db: Session = Depends(get_db2_r)) -> EdiRepository:
    return _build_repo(db)


def get_buildup_mawb_service(repo: EdiRepository = Depends(get_buildup_mawb_repo)) -> EdiService:
    return EdiService(repo)


def get_fwb_repo_r(db: Session = Depends(get_db1_r)) -> EdiRepository:
    return _build_repo(db)


def get_fwb_repo_w(db: Session = Depends(get_db1_w)) -> EdiRepository:
    return _build_repo(db)


def get_fwb_service_r(repo: EdiRepository = Depends(get_fwb_repo_r)) -> EdiService:
    return EdiService(repo)


def get_fwb_service_w(repo: EdiRepository = Depends(get_fwb_repo_w)) -> EdiService:
    return EdiService(repo)


def get_manifest_mawb_repo(db: Session = Depends(get_db1_r)) -> EdiRepository:
    return _build_repo(db)


def get_manifest_mawb_service(
    repo: EdiRepository = Depends(get_manifest_mawb_repo),
) -> EdiService:
    return EdiService(repo)
