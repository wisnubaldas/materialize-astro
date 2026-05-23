from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.repositories.master_airline_repository import MasterAirlineRepository
from app.services.master_airline_service import MasterAirlineService


def get_master_airline_repo_r(db: Session = Depends(get_db1_r)) -> MasterAirlineRepository:
    """
    Get read-only repository instance for Master Airlines.

    Args:
        db (Session): SQLAlchemy database session (read).

    Returns:
        MasterAirlineRepository: Repository instance.
    """
    return MasterAirlineRepository(db)


def get_master_airline_repo_w(db: Session = Depends(get_db1_w)) -> MasterAirlineRepository:
    """
    Get writable repository instance for Master Airlines.

    Args:
        db (Session): SQLAlchemy database session (write).

    Returns:
        MasterAirlineRepository: Repository instance.
    """
    return MasterAirlineRepository(db)


def get_master_airline_service_r(
    repo: MasterAirlineRepository = Depends(get_master_airline_repo_r),
) -> MasterAirlineService:
    """
    Get Master Airlines service instance linked to read-only repository.

    Args:
        repo (MasterAirlineRepository): Read-only repository.

    Returns:
        MasterAirlineService: Service instance.
    """
    return MasterAirlineService(repo)


def get_master_airline_service_w(
    repo: MasterAirlineRepository = Depends(get_master_airline_repo_w),
) -> MasterAirlineService:
    """
    Get Master Airlines service instance linked to writable repository.

    Args:
        repo (MasterAirlineRepository): Writable repository.

    Returns:
        MasterAirlineService: Service instance.
    """
    return MasterAirlineService(repo)
