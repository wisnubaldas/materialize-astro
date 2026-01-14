from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.repository.hubnet_request_repository import HubnetRequestRepository
from app.services.hubnet_service import HbnetRequestService


def _build_repo(db: Session) -> HubnetRequestRepository:
    return HubnetRequestRepository(db)


def get_export_excel_repository(
    db: Session = Depends(get_db1_r),
) -> HubnetRequestRepository:
    return _build_repo(db)


def get_data_sending_repository(
    db: Session = Depends(get_db1_r),
) -> HubnetRequestRepository:
    return _build_repo(db)


def get_export_excel_service(
    repo: HubnetRequestRepository = Depends(get_export_excel_repository),
) -> HbnetRequestService:
    return HbnetRequestService(repo)


def get_data_sending_per_bulan_service(
    repo: HubnetRequestRepository = Depends(get_data_sending_repository),
) -> HbnetRequestService:
    return HbnetRequestService(repo)


# ambil reponya dulu
