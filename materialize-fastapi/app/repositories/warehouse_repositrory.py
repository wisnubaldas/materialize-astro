import logging
from pathlib import Path

from sqlalchemy import bindparam, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.BaseDB1.build_up_dead_stock import BuildUpDeadStock
from app.models.BaseDB1.build_up_detail import BuildUpDetail
from app.models.BaseDB1.build_up_header import BuildUpHeader
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.services.datatables_service import DataTablesService

logger = logging.getLogger("warehouse")


class WarehouseRepository:
    QUERY_DIR = Path(__file__).resolve().parent / "query"
    EXPORT_BUILDUP_QUERY = "get_export_buildup.sql"
    DOMESTIC_OUTGOING_BUILDUP_QUERY = "get_domestic_outgoing_buildup.sql"

    MANIFEST_FIELD_MAP = {  # noqa: RUF012
        "number": "number_build_up",
        "link_pdf": "pdf_link",
        "created_at": "create_at",
        "updated_at": "update_at",
    }

    def __init__(self, db: Session, db_dead_stock: Session | None = None):
        self.db = db
        self.db_dead_stock = db_dead_stock or db
        self.manifest_flight_datatable_service = DataTablesService(
            model=BuildUpHeader,
            schema=ExpManifestFlightOut,
            search_columns=[
                "number_build_up",
                "airlines_code",
                "flight_date",
                "origin",
                "dest",
                "for_official_use",
            ],
            custom_filters=[
                "number_build_up",
                "airlines_code",
                "flight_date",
                "origin",
                "dest",
            ],
        )
        self.masterwaybill_datatable_service = DataTablesService(
            model=EksMasterWaybill,
            schema=EksMasterWaybillOut,
            pk_field="MasterAWB",
            search_columns=[
                "MasterAWB",
                "AirlinesCode",
                "FlightNo",
                "Origin",
                "Destination",
                "KindOfGood",
                "AgenCode",
                "ShipperCode",
                "ConsigneeCode",
                "bc11",
                "nopos",
            ],
            custom_filters=[
                "MasterAWB",
                "AirlinesCode",
                "FlightNo",
                "Origin",
                "Destination",
                "KindOfGood",
                "AgenCode",
                "ShipperCode",
                "ConsigneeCode",
                "DateOfFlight",
                "DateEntry",
            ],
        )

    def _normalize_manifest_flight_params(self, params: DataTablesParams) -> DataTablesParams:
        if params.filters:
            for legacy_name, build_up_name in self.MANIFEST_FIELD_MAP.items():
                legacy_value = getattr(params.filters, legacy_name, None)
                if legacy_value and not getattr(params.filters, build_up_name, None):
                    setattr(params.filters, build_up_name, legacy_value)

        for column in params.columns:
            mapped_column = self.MANIFEST_FIELD_MAP.get(column.data)
            if mapped_column:
                column.data = mapped_column

        return params

    def manifest_flight_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[ExpManifestFlightOut]:
        normalized_params = self._normalize_manifest_flight_params(params)
        return self.manifest_flight_datatable_service.get_datatable(
            db=self.db,
            params=normalized_params,
        )

    def get_manifest_flight_details(self, header_id: int) -> list[BuildUpDetail]:
        return (
            self.db.query(BuildUpDetail)
            .filter(BuildUpDetail.header_id == header_id)
            .order_by(BuildUpDetail.id.asc())
            .all()
        )

    def get_manifest_flight_with_details(
        self, header_id: int
    ) -> tuple[BuildUpHeader | None, list[BuildUpDetail]]:
        header = self.get_manifest_flight_by_id(header_id)
        if not header:
            return None, []
        details = self.get_manifest_flight_details(header_id)
        return header, details

    def get_manifest_flight_by_id(self, header_id: int) -> BuildUpHeader | None:
        return self.db.query(BuildUpHeader).filter(BuildUpHeader.id == header_id).first()

    def delete_manifest_flight(self, header_id: int) -> tuple[bool, str | None]:
        record = self.get_manifest_flight_by_id(header_id)
        if not record:
            return (False, None)

        pdf_link = record.pdf_link
        detail_ids = [
            detail_id
            for (detail_id,) in self.db.query(BuildUpDetail.id)
            .filter(BuildUpDetail.header_id == header_id)
            .all()
        ]

        if detail_ids:
            self.db.query(BuildUpDeadStock).filter(
                BuildUpDeadStock.build_up_detail_id.in_(detail_ids)
            ).delete(synchronize_session=False)

        self.db.delete(record)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return (True, pdf_link)

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.masterwaybill_datatable_service.get_datatable(db=self.db, params=params)

    @staticmethod
    def _normalize_awb_key(value: str | None) -> str:
        if not value:
            return ""
        return value.strip().upper()

    @staticmethod
    def _is_missing_dead_stock_table_error(exc: ProgrammingError) -> bool:
        original = getattr(exc, "orig", None)
        if original is not None:
            args = getattr(original, "args", ())
            if args and args[0] == 1146:
                return True
        message = str(exc).lower()
        return "build_up_dead_stock" in message and "doesn't exist" in message

    def _get_buildup_rows_by_awbs(
        self,
        master_awbs: list[str],
        query_filename: str,
    ) -> list[ExportBuildupOut]:
        query_path = self.QUERY_DIR / query_filename
        raw_query = query_path.read_text(encoding="utf-8")
        sql = text(raw_query).bindparams(bindparam("mawb", expanding=True))
        result = self.db.execute(sql, {"mawb": master_awbs})
        return [ExportBuildupOut.model_validate(dict(row._mapping)) for row in result]

    def _build_unique_awbs(self, master_awbs: list[str]) -> list[str]:
        unique_awbs: list[str] = []
        seen_awbs: set[str] = set()
        for awb in master_awbs:
            key = self._normalize_awb_key(awb)
            if not key or key in seen_awbs:
                continue
            seen_awbs.add(key)
            unique_awbs.append(awb.strip())
        return unique_awbs

    def _fetch_buildup_rows(self, unique_awbs: list[str]) -> list[ExportBuildupOut]:
        rows = self._get_buildup_rows_by_awbs(
            master_awbs=unique_awbs,
            query_filename=self.EXPORT_BUILDUP_QUERY,
        )
        existing_awb_keys = {
            self._normalize_awb_key(row.mawb) for row in rows if self._normalize_awb_key(row.mawb)
        }
        missing_awbs = [
            awb for awb in unique_awbs if self._normalize_awb_key(awb) not in existing_awb_keys
        ]
        if missing_awbs:
            rows.extend(
                self._get_buildup_rows_by_awbs(
                    master_awbs=missing_awbs,
                    query_filename=self.DOMESTIC_OUTGOING_BUILDUP_QUERY,
                )
            )
        return rows

    def _fetch_dead_stock_by_mawb(
        self,
        unique_awbs: list[str],
    ) -> dict[str, tuple[int | None, float | None]]:
        dead_stock_rows = []
        try:
            dead_stock_rows = (
                self.db_dead_stock.query(
                    BuildUpDeadStock.mawb.label("mawb"),
                    BuildUpDeadStock.pieces.label("pieces"),
                    BuildUpDeadStock.weight.label("weight"),
                    BuildUpDeadStock.id.label("id"),
                )
                .filter(BuildUpDeadStock.mawb.in_(unique_awbs))
                .order_by(BuildUpDeadStock.id.desc())
                .all()
            )
        except ProgrammingError as exc:
            if self._is_missing_dead_stock_table_error(exc):
                logger.warning(
                    "Tabel build_up_dead_stock belum tersedia. Fallback ke total default MAWB."
                )
                self.db_dead_stock.rollback()
            else:
                raise

        dead_stock_by_mawb: dict[str, tuple[int | None, float | None]] = {}
        for stock in dead_stock_rows:
            stock_key = self._normalize_awb_key(stock.mawb)
            if not stock_key or stock_key in dead_stock_by_mawb:
                continue
            dead_stock_by_mawb[stock_key] = (
                int(stock.pieces) if stock.pieces is not None else None,
                float(stock.weight) if stock.weight is not None else None,
            )
        return dead_stock_by_mawb

    def _map_rows_by_mawb(
        self,
        rows: list[ExportBuildupOut],
        dead_stock_by_mawb: dict[str, tuple[int | None, float | None]],
    ) -> dict[str, ExportBuildupOut]:
        by_mawb: dict[str, ExportBuildupOut] = {}
        for row in rows:
            key = self._normalize_awb_key(row.mawb)
            if not key or key in by_mawb:
                continue
            dead_stock_totals = dead_stock_by_mawb.get(key)
            if dead_stock_totals:
                pieces, weight = dead_stock_totals
                if pieces is not None:
                    row.total_pieces = pieces
                if weight is not None:
                    row.total_weight = weight
            by_mawb[key] = row
        return by_mawb

    def _order_rows_by_awb(
        self,
        unique_awbs: list[str],
        by_mawb: dict[str, ExportBuildupOut],
    ) -> list[ExportBuildupOut]:
        ordered_rows: list[ExportBuildupOut] = []
        for awb in unique_awbs:
            key = self._normalize_awb_key(awb)
            row = by_mawb.get(key)
            if row:
                ordered_rows.append(row)
        return ordered_rows

    def get_masterwaybill_by_awbs(self, master_awbs: list[str]) -> list[ExportBuildupOut]:
        """Fetch build-up master rows from SQL query based on MasterAWB list."""
        if not master_awbs:
            return []

        unique_awbs = self._build_unique_awbs(master_awbs)
        if not unique_awbs:
            return []

        rows = self._fetch_buildup_rows(unique_awbs)
        dead_stock_by_mawb = self._fetch_dead_stock_by_mawb(unique_awbs)
        by_mawb = self._map_rows_by_mawb(rows, dead_stock_by_mawb)
        return self._order_rows_by_awb(unique_awbs, by_mawb)
