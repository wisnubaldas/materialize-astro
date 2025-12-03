from app.repository.edi_repository import EdiRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.fhl_schema import FhlResponse
from app.schemas.weighing_detail_schema import WeighingDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut


class EdiService:
    data_table_response = DataTablesResponse[EksBuildUpDetailOut]

    def __init__(self, repo: EdiRepository):
        self.repository = repo

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.repository.datatable(params)

    def weighing_datatables(self, params: DataTablesParams) -> DataTablesResponse[WeighingHeaderOut]:
        return self.repository.weighing_datatable(params)

    def parse_fhl(self, awb: str) -> FhlResponse:
        header, details = self.repository.get_weighing_by_awb(awb)
        header_schema = WeighingHeaderOut.model_validate(header) if header else None
        detail_schema = [WeighingDetailOut.model_validate(item) for item in details]
        return FhlResponse(header=header_schema, details=detail_schema)
