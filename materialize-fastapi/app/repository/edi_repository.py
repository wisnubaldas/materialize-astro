from sqlalchemy.orm import Session, aliased

from app.models.eks_buildupdetail_model import EksBuildUpDetail
from app.models.eks_buildupheader import EksBuildupHeader
from app.models.eks_hostawb import EksHostAWB
from app.models.eks_masterwaybill import EksMasterWaybill
from app.models.mst_customer import MstCustomer
from app.models.weighing_detail_model import EksWeighingDetail
from app.models.weighing_header_model import EksWeighingHeader
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_hostawb import EksHostAWBOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.mst_customer_schema import CustomerOut
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.datatables_service import DataTablesService


class EdiRepository:
    def __init__(self, db: Session):
        self.db = db
        self.buildup_header_datatable_service = DataTablesService(
            model=EksBuildupHeader,
            schema=EksBuildupHeaderOut,
            pk_field="noid",
            search_columns=[
                "buildup_number",
                "airlines_code",
                "flight_number",
                "destination_code",
                "employee_number",
                "operator_name",
            ],
            custom_filters=[
                "buildup_number",
                "airlines_code",
                "flight_number",
                "destination_code",
                "date_of_flight",
                "employee_number",
                "date_entry",
            ],
        )
        self.buildup_detail_datatable_service = DataTablesService(
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

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[EksBuildupHeaderOut]:
        return self.buildup_header_datatable_service.get_datatable(db=self.db, params=params)

    def buildup_detail_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksBuildUpDetailOut]:
        return self.buildup_detail_datatable_service.get_datatable(db=self.db, params=params)

    def weighing_datatable(self, params: DataTablesParams) -> DataTablesResponse[WeighingHeaderOut]:
        return self.weighing_datatable_service.get_datatable(db=self.db, params=params)

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.masterwaybill_datatable_service.get_datatable(db=self.db, params=params)

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

    def get_awb_mawb(self, mawb: str) -> AwbMawbResponse | None:
        agen_customer = aliased(MstCustomer)
        shipper_customer = aliased(MstCustomer)

        rows = (
            self.db.query(EksMasterWaybill, EksHostAWB, agen_customer, shipper_customer)
            .join(EksHostAWB, EksMasterWaybill.MasterAWB == EksHostAWB.MasterAWB)
            .join(agen_customer, EksMasterWaybill.AgenCode == agen_customer.CustomerCode)
            .join(shipper_customer, EksMasterWaybill.ShipperCode == shipper_customer.CustomerCode)
            .filter(EksMasterWaybill.MasterAWB == mawb)
            .all()
        )

        if not rows:
            return None

        master = rows[0][0]
        agen = rows[0][2]
        shipper = rows[0][3]
        host_awbs = [row[1] for row in rows]

        return AwbMawbResponse(
            master=EksMasterWaybillOut.model_validate(master),
            host_awbs=[EksHostAWBOut.model_validate(item) for item in host_awbs],
            agen=CustomerOut.model_validate(agen) if agen else None,
            shipper=CustomerOut.model_validate(shipper) if shipper else None,
        )

    def get_buildup_mawb(self, buildup_number: str):
        """
        Ambil data buildup berikut detail, master AWB, dan host AWB.
        Semua relasi wajib ada; jika ada yang hilang kembalikan error.
        """
        if not buildup_number:
            raise ValueError("data buildup atau awb, mawb tidak lengkap")

        rows = (
            self.db.query(EksBuildupHeader, EksBuildUpDetail, EksMasterWaybill, EksHostAWB)
            .join(EksBuildUpDetail, EksBuildupHeader.buildup_number == EksBuildUpDetail.BuildUpNumber)
            .join(EksMasterWaybill, EksBuildUpDetail.MasterAWB == EksMasterWaybill.MasterAWB)
            .join(EksHostAWB, EksBuildUpDetail.MasterAWB == EksHostAWB.MasterAWB)
            .filter(EksBuildupHeader.buildup_number == buildup_number)
            .all()
        )

        if not rows:
            missing = [
                "eks_buildupheader",
                "eks_buildupdetail",
                "eks_masterwaybill",
                "eks_hostawb",
            ]
            raise ValueError(
                f"data buildup atau awb, mawb tidak lengkap pada relasi: {', '.join(missing)}"
            )

        header = rows[0][0]
        master = rows[0][2]
        details = [row[1] for row in rows if row[1] is not None]
        host_awbs = [row[3] for row in rows if row[3] is not None]

        missing_relations = []
        if not header:
            missing_relations.append("eks_buildupheader")
        if not details:
            missing_relations.append("eks_buildupdetail")
        if not master:
            missing_relations.append("eks_masterwaybill")
        if not host_awbs:
            missing_relations.append("eks_hostawb")

        if missing_relations:
            raise ValueError(
                f"data buildup atau awb, mawb tidak lengkap pada relasi: {', '.join(missing_relations)}"
            )

        return {
            "buildup": EksBuildupHeaderOut.model_validate(header),
            "details": [EksBuildUpDetailOut.model_validate(item) for item in details],
            "master": EksMasterWaybillOut.model_validate(master),
            "host_awbs": [EksHostAWBOut.model_validate(item) for item in host_awbs],
        }
