from sqlalchemy.orm import Session

from app.models.eks_buildupdetail_model import EksBuildUpDetail
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
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

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.datatable_service.get_datatable(db=self.db, params=params)
