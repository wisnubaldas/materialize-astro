from sqlalchemy.orm import Session

from app.models.BaseDB1.mst_discrepancy_code import MstDiscrepancyCode


class DiscrepancyCodeRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[MstDiscrepancyCode]:
        return (
            self.db.query(MstDiscrepancyCode)
            .order_by(MstDiscrepancyCode.code.asc())
            .all()
        )
