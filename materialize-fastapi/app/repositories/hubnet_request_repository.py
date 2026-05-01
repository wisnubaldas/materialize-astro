from datetime import datetime

from sqlalchemy import and_, case, func
from sqlalchemy.orm import Session

from app.models.BaseDB1.hubnet_request import HubnetRequest


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

    def get_data_sending_perbulan(self, bulan: str) -> list[dict[str, int | str]]:
        bulan = bulan.strip()
        try:
            datetime.strptime(bulan, "%Y-%m")  # noqa: DTZ007
        except ValueError as exc:
            raise ValueError("format bulan harus YYYY-MM") from exc

        tanggal = func.substr(HubnetRequest.FLT_DATE, 1, 10).label("tanggal")
        ekspor = func.sum(
            case(
                (
                    and_(HubnetRequest.IS_INTERNATIONAL == "1", HubnetRequest.IS_EKSPOR == "1"),
                    1,
                ),
                else_=0,
            )
        ).label("ekspor")
        impor = func.sum(
            case(
                (
                    and_(HubnetRequest.IS_INTERNATIONAL == "1", HubnetRequest.IS_EKSPOR == "0"),
                    1,
                ),
                else_=0,
            )
        ).label("impor")
        outgoing = func.sum(
            case(
                (
                    and_(HubnetRequest.IS_INTERNATIONAL == "0", HubnetRequest.IS_EKSPOR == "1"),
                    1,
                ),
                else_=0,
            )
        ).label("outgoing")
        incoming = func.sum(
            case(
                (
                    and_(HubnetRequest.IS_INTERNATIONAL == "0", HubnetRequest.IS_EKSPOR == "0"),
                    1,
                ),
                else_=0,
            )
        ).label("incoming")

        rows = (
            self.db.query(
                tanggal,
                func.count(HubnetRequest.id).label("total"),
                ekspor,
                impor,
                outgoing,
                incoming,
            )
            .filter(
                func.substr(HubnetRequest.FLT_DATE, 1, 7) == bulan,
                HubnetRequest.IS_SEND == "1",
            )
            .group_by(tanggal)
            .order_by(tanggal)
            .all()
        )
        return [
            {
                "tanggal": row.tanggal,
                "total": row.total,
                "ekspor": row.ekspor,
                "import": row.impor,
                "outgoing": row.outgoing,
                "incoming": row.incoming,
            }
            for row in rows
        ]

    def get_sending_status_summary_perbulan(self, bulan: str) -> dict[str, int]:
        bulan = bulan.strip()
        try:
            datetime.strptime(bulan, "%Y-%m")  # noqa: DTZ007
        except ValueError as exc:
            raise ValueError("format bulan harus YYYY-MM") from exc

        sent = func.sum(case((HubnetRequest.IS_SEND == "1", 1), else_=0)).label("sent")
        failed = func.sum(case((HubnetRequest.IS_FAILED == "1", 1), else_=0)).label("failed")
        pending = func.sum(
            case(
                (
                    and_(HubnetRequest.IS_SEND != "1", HubnetRequest.IS_FAILED != "1"),
                    1,
                ),
                else_=0,
            )
        ).label("pending")
        total = func.count(HubnetRequest.id).label("total")

        row = (
            self.db.query(sent, failed, pending, total)
            .filter(func.substr(HubnetRequest.FLT_DATE, 1, 7) == bulan)
            .one()
        )

        return {
            "sent": int(row.sent or 0),
            "failed": int(row.failed or 0),
            "pending": int(row.pending or 0),
            "total": int(row.total or 0),
        }
