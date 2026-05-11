from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repositories.setting_repository import SettingRepository
from app.services.setting_service import SettingService


def get_setting_repo_r(db: Session = Depends(get_db1_r)) -> SettingRepository:
    return SettingRepository(db)


def get_setting_service_r(repo: SettingRepository = Depends(get_setting_repo_r)) -> SettingService:
    return SettingService(repo)


def get_setting_repo_w(db: Session = Depends(get_db1_w)) -> SettingRepository:
    return SettingRepository(db)


def get_setting_service_w(repo: SettingRepository = Depends(get_setting_repo_w)) -> SettingService:
    return SettingService(repo)
