from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.hubnet_request import HubnetRequest


class HubnetRequestRepository:
    """
    Layer akses data untuk Item.
    TIDAK mengandung logika bisnis — hanya CRUD/raw query ke DB.
    """

    def __init__(self, db: Session):
        self.db = db

    def export_to_excel(self, bulan: str) -> list[HubnetRequest]:
        bulan = bulan.strip()
        try:
            datetime.strptime(bulan, "%Y-%m")  # noqa: DTZ007
        except ValueError as exc:
            raise ValueError("Format bulan harus YYYY-MM") from exc

        return (
            self.db.query(HubnetRequest)
            .filter(func.substr(HubnetRequest.FLT_DATE, 1, 7) == bulan)
            .all()
        )
