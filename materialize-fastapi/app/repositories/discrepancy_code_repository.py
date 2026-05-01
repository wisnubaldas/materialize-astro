from sqlalchemy.orm import Session

from app.models.BaseDB1.mst_discrepancy_code import MstDiscrepancyCode
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_discrepancy_code_schema import MstDiscrepancyCodeOut
from app.services.datatables_service import DataTablesService


class DiscrepancyCodeRepository:
    def __init__(self, db: Session):
        self.db = db
        self.datatable_service = DataTablesService(
            model=MstDiscrepancyCode,
            schema=MstDiscrepancyCodeOut,
            search_columns=["code", "category", "name", "description", "severity"],
            custom_filters=["code", "category", "name", "severity"],
        )

    def list_all(self) -> list[MstDiscrepancyCode]:
        return (
            self.db.query(MstDiscrepancyCode)
            .order_by(MstDiscrepancyCode.code.asc())
            .all()
        )

    def datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[MstDiscrepancyCodeOut]:
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def get_by_id(self, code_id: int) -> MstDiscrepancyCode | None:
        return self.db.query(MstDiscrepancyCode).filter(MstDiscrepancyCode.id == code_id).first()

    def get_by_code(self, code: str) -> MstDiscrepancyCode | None:
        return self.db.query(MstDiscrepancyCode).filter(MstDiscrepancyCode.code == code).first()

    def create(self, record: MstDiscrepancyCode) -> MstDiscrepancyCode:
        self.db.add(record)
        return self._commit(record)

    def save(self, record: MstDiscrepancyCode) -> MstDiscrepancyCode:
        return self._commit(record)

    def delete(self, record: MstDiscrepancyCode) -> None:
        self.db.delete(record)
        self.db.commit()

    def _commit(self, record: MstDiscrepancyCode) -> MstDiscrepancyCode:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record
