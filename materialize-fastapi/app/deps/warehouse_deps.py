from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db2_r
from app.repository.warehouse_repositrory import WarehouseRepository
from app.services.warehouse_service import WarehouseService


def get_warehouse_repo(db: Session = Depends(get_db2_r)) -> WarehouseRepository:
    return WarehouseRepository(db)


def get_warehouse_service(
    repo: WarehouseRepository = Depends(get_warehouse_repo),
) -> WarehouseService:
    return WarehouseService(repo)
