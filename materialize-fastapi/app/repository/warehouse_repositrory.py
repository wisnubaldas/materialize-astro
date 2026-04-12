from pathlib import Path

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.models.BaseDB1.build_up_detail import BuildUpDetail
from app.models.BaseDB1.build_up_header import BuildUpHeader
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.services.datatables_service import DataTablesService


class WarehouseRepository:
    MANIFEST_FIELD_MAP = {
        "number": "number_build_up",
        "link_pdf": "pdf_link",
        "created_at": "create_at",
        "updated_at": "update_at",
    }

    def __init__(self, db: Session):
        self.db = db
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

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.masterwaybill_datatable_service.get_datatable(db=self.db, params=params)

    def get_masterwaybill_by_awbs(self, master_awbs: list[str]) -> list[ExportBuildupOut]:
        """Fetch build-up master rows from SQL query based on MasterAWB list."""
        if not master_awbs:
            return []

        unique_awbs = list(dict.fromkeys(master_awbs))
        query_path = (
            Path(__file__).resolve().parent / "query" / "get_export_buildup.sql"
        )
        raw_query = query_path.read_text(encoding="utf-8")
        sql = text(raw_query).bindparams(bindparam("mawb", expanding=True))

        result = self.db.execute(sql, {"mawb": unique_awbs})
        rows = [ExportBuildupOut.model_validate(dict(row._mapping)) for row in result]

        by_mawb: dict[str, list[ExportBuildupOut]] = {}
        for row in rows:
            by_mawb.setdefault(row.mawb, []).append(row)

        ordered_rows: list[ExportBuildupOut] = []
        for awb in unique_awbs:
            ordered_rows.extend(by_mawb.get(awb, []))

        return ordered_rows
