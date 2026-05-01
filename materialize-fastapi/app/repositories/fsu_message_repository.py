from sqlalchemy.orm import Session

from app.models.BaseDB1.fsu_message import FsuMessage
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.fsu_message_schema import FsuMessageOut
from app.services.datatables_service import DataTablesService


class FsuMessageRepository:
    def __init__(self, db: Session):
        self.db = db
        self.datatable_service = DataTablesService(
            model=FsuMessage,
            schema=FsuMessageOut,
            search_columns=["code", "remark"],
            custom_filters=["code", "remark"],
        )

    def list_all(self) -> list[FsuMessage]:
        return self.db.query(FsuMessage).order_by(FsuMessage.code.asc()).all()

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[FsuMessageOut]:
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def get_by_id(self, message_id: int) -> FsuMessage | None:
        return self.db.query(FsuMessage).filter(FsuMessage.id == message_id).first()

    def get_by_code(self, code: str) -> FsuMessage | None:
        return self.db.query(FsuMessage).filter(FsuMessage.code == code).first()

    def create(self, record: FsuMessage) -> FsuMessage:
        self.db.add(record)
        return self._commit(record)

    def save(self, record: FsuMessage) -> FsuMessage:
        return self._commit(record)

    def delete(self, record: FsuMessage) -> None:
        self.db.delete(record)
        self.db.commit()

    def _commit(self, record: FsuMessage) -> FsuMessage:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record
