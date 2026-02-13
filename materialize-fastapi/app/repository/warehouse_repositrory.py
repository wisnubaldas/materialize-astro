from sqlalchemy.orm import Session

from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.services.datatables_service import DataTablesService


class WarehouseRepository:
    def __init__(self, db: Session):
        self.db = db
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

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.masterwaybill_datatable_service.get_datatable(db=self.db, params=params)

    def get_masterwaybill_by_awbs(self, master_awbs: list[str]) -> list[EksMasterWaybill]:
        """Fetch Master AWB records in bulk based on a list of MasterAWB values."""
        if not master_awbs:
            return []

        unique_awbs = list(dict.fromkeys(master_awbs))
        return (
            self.db.query(EksMasterWaybill)
            .filter(EksMasterWaybill.MasterAWB.in_(unique_awbs))
            .all()
        )
