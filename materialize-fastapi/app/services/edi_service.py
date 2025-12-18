from app.repository.edi_repository import EdiRepository
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.fhl_schema import FhlResponse
from app.schemas.weighing_detail_schema import WeighingDetailOut
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.utils.jinja import jinja_env
from app.utils.mail_config import smtp_email_service


class EdiService:
    data_table_response = DataTablesResponse[EksBuildupHeaderOut]

    def __init__(self, repo: EdiRepository):
        self.repository = repo

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildupHeaderOut]:
        return self.repository.datatable(params)

    def buildup_detail_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.repository.buildup_detail_datatable(params)

    def weighing_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[WeighingHeaderOut]:
        return self.repository.weighing_datatable(params)

    def masterwaybill_datatables(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.repository.masterwaybill_datatable(params)

    def parse_fhl(self, awb: str) -> FhlResponse:
        header, details = self.repository.get_weighing_by_awb(awb)
        header_schema = WeighingHeaderOut.model_validate(header) if header else None
        detail_schema = [WeighingDetailOut.model_validate(item) for item in details]
        return FhlResponse(header=header_schema, details=detail_schema)

    def parse_awb_mawb(self, mawb: str) -> AwbMawbResponse | None:
        return self.repository.get_awb_mawb(mawb)

    def fetch_data_buildup_mawb(self, buildup_number: str):
        return self.repository.get_buildup_mawb(buildup_number)

    @staticmethod
    async def send_email_fhl(email: str, fhl: str):
        try:
            if "@" not in email:
                raise ValueError("Invalid email format")
            template = jinja_env.get_template("email-template/fhl.html")
            html_str = template.render({"fhl": fhl})
            await smtp_email_service.send_email(
                to_email=email,
                subject="FHL MessageSchema",
                html_body=html_str,
            )
            # print(html_str)
        except ValueError as e:
            raise ValueError("Duplicate or invalid data") from e
