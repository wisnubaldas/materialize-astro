from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService


def get_auth_repo(db: Session = Depends(get_db1_r)) -> AuthRepository:
    return AuthRepository(db)


def get_auth_service(repo: AuthRepository = Depends(get_auth_repo)) -> AuthService:
    return AuthService(repo)
