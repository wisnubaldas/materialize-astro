from app.models.BaseDB1.fsu_message import FsuMessage
from app.repository.fsu_message_repository import FsuMessageRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.fsu_message_schema import FsuMessageCreate, FsuMessageOut, FsuMessageUpdate


class FsuMessageService:
    def __init__(self, repo: FsuMessageRepository):
        self.repository = repo

    def list_all(self):
        return self.repository.list_all()

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[FsuMessageOut]:
        return self.repository.datatable(params)

    def get_by_id(self, message_id: int) -> FsuMessage | None:
        return self.repository.get_by_id(message_id)

    def get_by_code(self, code: str) -> FsuMessage | None:
        return self.repository.get_by_code(code)

    def create(self, payload: FsuMessageCreate) -> FsuMessage:
        record = FsuMessage(**payload.model_dump())
        return self.repository.create(record)

    def update(self, record: FsuMessage, payload: FsuMessageUpdate) -> FsuMessage:
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return record
        for key, value in data.items():
            setattr(record, key, value)
        return self.repository.save(record)

    def delete(self, record: FsuMessage) -> None:
        self.repository.delete(record)
