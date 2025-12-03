from sqlalchemy.orm import Session

from app.models.eks_buildupdetail_model import EksBuildUpDetail
from app.models.weighing_detail_model import EksWeighingDetail
from app.models.weighing_header_model import EksWeighingHeader
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.datatables_service import DataTablesService


class EdiRepository:
    def __init__(self, db: Session):
        self.db = db
        self.datatable_service = DataTablesService(
            model=EksBuildUpDetail,
            schema=EksBuildUpDetailOut,
            pk_field="noid",
            search_columns=[
                "BuildUpNumber",
                "MasterAWB",
                "UldCardNumber",
                "KindOfGood",
                "EmployeeNumber",
                "AgenCode",
                "condition",
                "Remarks",
            ],
            custom_filters=[
                "BuildUpNumber",
                "MasterAWB",
                "TransitCode",
                "UldCardNumber",
                "AgenCode",
                "DateEntry",
                "TimeEntry",
            ],
        )
        self.weighing_datatable_service = DataTablesService(
            model=EksWeighingHeader,
            schema=WeighingHeaderOut,
            pk_field="noid",
            search_columns=[
                "ProofNumber",
                "MasterAWB",
                "AirlinesCode",
                "Origin",
                "Destination",
                "FlightNumber",
                "ShipperCode",
                "AgenCode",
                "ConsigneeCode",
                "AgenPIC",
                "EmployeeNumber",
                "InvoiceNumber",
            ],
            custom_filters=[
                "ProofNumber",
                "MasterAWB",
                "AirlinesCode",
                "Origin",
                "Destination",
                "FlightNumber",
                "ShipperCode",
                "AgenCode",
                "ConsigneeCode",
                "AgenPIC",
                "DateOfEntry",
                "TimeOfEntry",
                "DateOfFlight",
                "EmployeeNumber",
                "InvoiceNumber",
            ],
        )

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def weighing_datatable(self, params: DataTablesParams) -> DataTablesResponse[WeighingHeaderOut]:
        return self.weighing_datatable_service.get_datatable(db=self.db, params=params)

    def get_weighing_by_awb(
        self, awb: str
    ) -> tuple[EksWeighingHeader | None, list[EksWeighingDetail]]:
        header = (
            self.db.query(EksWeighingHeader)
            .filter(EksWeighingHeader.MasterAWB == awb)
            .order_by(EksWeighingHeader.created_at.desc())
            .first()
        )
        details = (
            self.db.query(EksWeighingDetail)
            .filter(EksWeighingDetail.MasterAWB == awb)
            .order_by(EksWeighingDetail.created_at.desc())
            .all()
        )
        return header, details
