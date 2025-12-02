from app.repository.edi_repository import EdiRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut


class EdiService:
    data_table_response = DataTablesResponse[EksBuildUpDetailOut]

    def __init__(self, repo: EdiRepository):
        self.repository = repo

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.repository.datatable(params)
