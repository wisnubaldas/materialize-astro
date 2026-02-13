from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repository.fsu_message_repository import FsuMessageRepository
from app.services.fsu_message_service import FsuMessageService


def get_fsu_message_repo_r(db: Session = Depends(get_db1_r)) -> FsuMessageRepository:
    return FsuMessageRepository(db)


def get_fsu_message_repo_w(db: Session = Depends(get_db1_w)) -> FsuMessageRepository:
    return FsuMessageRepository(db)


def get_fsu_message_service_r(
    repo: FsuMessageRepository = Depends(get_fsu_message_repo_r),
) -> FsuMessageService:
    return FsuMessageService(repo)


def get_fsu_message_service_w(
    repo: FsuMessageRepository = Depends(get_fsu_message_repo_w),
) -> FsuMessageService:
    return FsuMessageService(repo)
