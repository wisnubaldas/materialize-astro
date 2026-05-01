from datetime import datetime, timezone

from app.models.BaseDB1.mst_discrepancy_code import MstDiscrepancyCode
from app.repositories.discrepancy_code_repository import DiscrepancyCodeRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_discrepancy_code_schema import (
    MstDiscrepancyCodeCreate,
    MstDiscrepancyCodeOut,
    MstDiscrepancyCodeUpdate,
)


class DiscrepancyCodeService:
    def __init__(self, repo: DiscrepancyCodeRepository):
        self.repository = repo

    def list_all(self):
        return self.repository.list_all()

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[MstDiscrepancyCodeOut]:
        return self.repository.datatable(params)

    def get_by_id(self, code_id: int) -> MstDiscrepancyCode | None:
        return self.repository.get_by_id(code_id)

    def get_by_code(self, code: str) -> MstDiscrepancyCode | None:
        return self.repository.get_by_code(code)

    def create(self, payload: MstDiscrepancyCodeCreate) -> MstDiscrepancyCode:
        record = MstDiscrepancyCode(**payload.model_dump())
        return self.repository.create(record)

    def update(
        self, record: MstDiscrepancyCode, payload: MstDiscrepancyCodeUpdate
    ) -> MstDiscrepancyCode:
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return record
        for key, value in data.items():
            setattr(record, key, value)
        record.updated_at = datetime.now(timezone.utc)
        return self.repository.save(record)

    def delete(self, record: MstDiscrepancyCode) -> None:
        self.repository.delete(record)

