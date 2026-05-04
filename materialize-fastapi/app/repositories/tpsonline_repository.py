from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.tpsonline_schema import TpsOnlineImpInOut


class TpsOnlineRepository:
    """Repository for TPS Online read operations using DB3 session."""

    def __init__(self, db: Session):
        self.db = db

    def find_imp_in_by_no_bl_awb(self, no_bl_awb: str) -> list[TpsOnlineImpInOut]:
        """Fetch rows from `get_imp_in` filtered by `no_bl_awb`."""
        query = text("SELECT * FROM get_imp_in WHERE no_bl_awb = :no_bl_awb")
        result = self.db.execute(query, {"no_bl_awb": no_bl_awb})
        return [TpsOnlineImpInOut.model_validate(dict(row)) for row in result.mappings().all()]
