import logging
from pathlib import Path

from sqlalchemy import bindparam, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.BaseDB1.build_up_check_detail import BuildUpCheckDetail
from app.models.BaseDB1.build_up_check_header import BuildUpCheckHeader
from app.models.BaseDB1.build_up_check_rincian import BuildUpCheckRincian
from app.models.BaseDB1.build_up_dead_stock import BuildUpDeadStock
from app.models.BaseDB1.build_up_detail import BuildUpDetail
from app.models.BaseDB1.build_up_draft import BuildUpDraft
from app.models.BaseDB1.build_up_header import BuildUpHeader
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckHeaderCreate,
    BuildUpCheckRincianCreate,
)
from app.schemas.build_up_draft_schema import BuildUpDraftCreate, BuildUpDraftUpdate
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

    def list_build_up_drafts(self) -> list[BuildUpDraft]:
        """Return BuildUp drafts ordered newest first."""
        return self.db.query(BuildUpDraft).order_by(BuildUpDraft.create_at.desc()).all()

    def get_build_up_draft_by_id(self, draft_id: int) -> BuildUpDraft | None:
        return self.db.query(BuildUpDraft).filter(BuildUpDraft.id == draft_id).first()

    def create_build_up_draft(self, payload: BuildUpDraftCreate) -> BuildUpDraft:
        draft = BuildUpDraft(
            rows=payload.rows,
            payload=payload.payload,
            ignored=payload.ignored,
            master_awbs=payload.master_awbs,
        )
        self.db.add(draft)
        try:
            self.db.commit()
            self.db.refresh(draft)
        except Exception:
            self.db.rollback()
            raise
        return draft

    def update_build_up_draft(
        self,
        draft: BuildUpDraft,
        payload: BuildUpDraftUpdate,
    ) -> BuildUpDraft:
        draft.rows = payload.rows
        draft.payload = payload.payload
        draft.ignored = payload.ignored
        draft.master_awbs = payload.master_awbs
        try:
            self.db.commit()
            self.db.refresh(draft)
        except Exception:
            self.db.rollback()
            raise
        return draft

    def delete_build_up_draft(self, draft: BuildUpDraft) -> None:
        self.db.delete(draft)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

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

    def list_build_up_check_headers(
        self,
        flight_date: str | None = None,
        unfinished_only: bool = False,
        completed_only: bool = False,
    ) -> list[BuildUpCheckHeader]:
        """Return Build Up check headers ordered newest first."""
        query = self.db.query(BuildUpCheckHeader)
        if flight_date:
            query = query.filter(BuildUpCheckHeader.flight_date == flight_date)
        if completed_only:
            query = query.filter(
                BuildUpCheckHeader.details.any(),
                ~BuildUpCheckHeader.details.any(BuildUpCheckDetail.status == 0),
            )
        elif unfinished_only:
            query = query.filter(
                (~BuildUpCheckHeader.details.any())
                | BuildUpCheckHeader.details.any(BuildUpCheckDetail.status == 0)
            )
        return query.order_by(BuildUpCheckHeader.id.desc()).all()

    def get_build_up_check_header_by_id(self, header_id: int) -> BuildUpCheckHeader | None:
        """Return one Build Up check header by id."""
        return (
            self.db.query(BuildUpCheckHeader)
            .filter(BuildUpCheckHeader.id == header_id)
            .first()
        )

    def create_build_up_check_header(
        self,
        payload: BuildUpCheckHeaderCreate,
    ) -> BuildUpCheckHeader:
        """Create a Build Up check header."""
        header = BuildUpCheckHeader(**payload.model_dump())
        self.db.add(header)
        try:
            self.db.commit()
            self.db.refresh(header)
        except Exception:
            self.db.rollback()
            raise
        return header

    def list_build_up_check_details(self, header_id: int) -> list[BuildUpCheckDetail]:
        """Return details for a Build Up check header."""
        return (
            self.db.query(BuildUpCheckDetail)
            .filter(BuildUpCheckDetail.header_id == header_id)
            .order_by(BuildUpCheckDetail.id.asc())
            .all()
        )

    def get_build_up_check_detail_by_id(self, detail_id: int) -> BuildUpCheckDetail | None:
        """Return one Build Up check detail."""
        return (
            self.db.query(BuildUpCheckDetail)
            .filter(BuildUpCheckDetail.id == detail_id)
            .first()
        )

    def create_build_up_check_detail(
        self,
        header_id: int,
        payload: BuildUpCheckDetailCreate,
    ) -> BuildUpCheckDetail:
        """Create a MAWB detail for a Build Up check header."""
        detail = BuildUpCheckDetail(header_id=header_id, **payload.model_dump())
        self.db.add(detail)
        try:
            self.db.commit()
            self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return detail

    def create_build_up_check_rincian(
        self,
        detail_id: int,
        payload: BuildUpCheckRincianCreate,
    ) -> BuildUpCheckRincian:
        """Create rincian pieces for a Build Up check detail."""
        rincian = BuildUpCheckRincian(check_detail_id=detail_id, **payload.model_dump())
        self.db.add(rincian)
        try:
            self.db.commit()
            self.db.refresh(rincian)
        except Exception:
            self.db.rollback()
            raise
        return rincian

    def update_build_up_check_detail_status(
        self,
        detail: BuildUpCheckDetail,
        status: int,
    ) -> BuildUpCheckDetail:
        """Update Build Up check detail completion status."""
        detail.status = status
        try:
            self.db.commit()
            self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return detail

    def reopen_build_up_check_header(self, header: BuildUpCheckHeader) -> BuildUpCheckHeader:
        """Set every detail under a header back to unfinished status."""
        for detail in header.details:
            detail.status = 0
        try:
            self.db.commit()
            self.db.refresh(header)
        except Exception:
            self.db.rollback()
            raise
        return header
