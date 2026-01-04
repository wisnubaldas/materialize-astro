import logging

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

logger = logging.getLogger("edi")


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
    async def send_email_edi(email: str, message: str, edi: str):
        try:
            if "@" not in email:
                logger.warning("Invalid email format for EDI send: %s", email)
                raise ValueError("Invalid email format")
            template = jinja_env.get_template("email-template/fhl.html")
            html_str = template.render({"message": message, "edi": edi})

            logger.info("Sending EDI email to %s for %s", email, edi)
            await smtp_email_service.send_email(
                to_email=email,
                subject="EDI Messages " + edi,
                html_body=html_str,
            )
            logger.info("EDI email sent to %s for %s", email, edi)
        except ValueError as e:
            logger.warning("Sending EDI email failed due to input validation: %s", e)
            raise ValueError("Sending email error") from e
        except Exception:
            logger.exception("Sending EDI email failed to %s for %s", email, edi)
            raise
