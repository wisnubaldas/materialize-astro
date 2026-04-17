from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w, get_db2_r
from app.repository.warehouse_repositrory import WarehouseRepository
from app.services.warehouse_service import WarehouseService


def get_warehouse_manifest_repo(db: Session = Depends(get_db1_r)) -> WarehouseRepository:
    return WarehouseRepository(db)


def get_warehouse_manifest_service(
    repo: WarehouseRepository = Depends(get_warehouse_manifest_repo),
) -> WarehouseService:
    return WarehouseService(repo)


def get_warehouse_manifest_repo_w(db: Session = Depends(get_db1_w)) -> WarehouseRepository:
    return WarehouseRepository(db)


def get_warehouse_manifest_service_w(
    repo: WarehouseRepository = Depends(get_warehouse_manifest_repo_w),
) -> WarehouseService:
    return WarehouseService(repo)


def get_warehouse_repo(db: Session = Depends(get_db2_r)) -> WarehouseRepository:
    return WarehouseRepository(db)


def get_warehouse_repo_with_dead_stock(
    db: Session = Depends(get_db2_r),
    db_dead_stock: Session = Depends(get_db1_r),
) -> WarehouseRepository:
    return WarehouseRepository(db=db, db_dead_stock=db_dead_stock)


def get_warehouse_service(
    repo: WarehouseRepository = Depends(get_warehouse_repo_with_dead_stock),
) -> WarehouseService:
    return WarehouseService(repo)
