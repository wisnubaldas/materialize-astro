from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.models.BaseDB2.eks_buildupdetail_model import EksBuildUpDetail
from app.models.BaseDB2.eks_buildupheader import EksBuildupHeader
from app.models.BaseDB2.eks_hostawb import EksHostAWB
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.models.BaseDB2.mst_customer import MstCustomer
from app.models.BaseDB2.weighing_detail_model import EksWeighingDetail
from app.models.BaseDB2.weighing_header_model import EksWeighingHeader
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
        params = self.weighing_datatable_service.apply_custom_filters(params)

        base_query = self.db.query(EksWeighingHeader)

        custom_filter_conditions = []
        if params.filters:
            filters = params.filters
            for filter_name in self.weighing_datatable_service.custom_filters:
                filter_value = getattr(filters, filter_name, None)
                if not filter_value:
                    continue
                model_column = getattr(EksWeighingHeader, filter_name, None)
                if model_column is None:
                    continue
                custom_filter_conditions.append(model_column.like(f"%{filter_value}%"))

        global_search_conditions = []
        if params.search.value and self.weighing_datatable_service.search_columns:
            search_value = f"%{params.search.value}%"
            global_search_conditions = [
                getattr(EksWeighingHeader, col_name).like(search_value)
                for col_name in self.weighing_datatable_service.search_columns
                if hasattr(EksWeighingHeader, col_name)
            ]

        combined_filters = []
        if custom_filter_conditions:
            combined_filters.append(and_(*custom_filter_conditions))
        if global_search_conditions:
            combined_filters.append(or_(*global_search_conditions))

        if combined_filters:
            base_query = base_query.filter(and_(*combined_filters))

        total_records = self.db.query(func.count(func.distinct(EksWeighingHeader.MasterAWB))).scalar()
        filtered_records = base_query.with_entities(
            func.count(func.distinct(EksWeighingHeader.MasterAWB))
        ).scalar()

        subquery = (
            base_query.with_entities(func.max(EksWeighingHeader.noid).label("noid"))
            .group_by(EksWeighingHeader.MasterAWB)
            .subquery()
        )

        query = self.db.query(EksWeighingHeader).join(
            subquery, EksWeighingHeader.noid == subquery.c.noid
        )

        for order in params.order:
            col_idx = order.column
            col_name = params.columns[col_idx].data
            direction = order.dir

            if hasattr(EksWeighingHeader, col_name):
                col: InstrumentedAttribute = getattr(EksWeighingHeader, col_name)
                if direction == "desc":
                    query = query.order_by(col.desc())
                else:
                    query = query.order_by(col.asc())

        results = query.offset(params.start).limit(params.length).all()

        return DataTablesResponse(
            draw=params.draw,
            recordsTotal=total_records or 0,
            recordsFiltered=filtered_records or 0,
            data=[WeighingHeaderOut.model_validate(item) for item in results],
        )

    def masterwaybill_datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[EksMasterWaybillOut]:
        return self.masterwaybill_datatable_service.get_datatable(db=self.db, params=params)

    # query tarik data fhl di table weighing
    def get_weighing_by_awb(
        self, awb: str
    ) -> tuple[EksWeighingHeader | None, list[EksWeighingDetail]]:
        shipper_customer = aliased(MstCustomer)
        consignee_customer = aliased(MstCustomer)

        rows = (
            self.db.query(
                EksWeighingHeader,
                EksWeighingDetail,
                shipper_customer,
                consignee_customer,
            )
            .outerjoin(
                EksWeighingDetail,
                EksWeighingDetail.ProofNumber == EksWeighingHeader.ProofNumber,
            )
            .outerjoin(
                shipper_customer, shipper_customer.CustomerCode == EksWeighingHeader.ShipperCode
            )
            .outerjoin(
                consignee_customer,
                consignee_customer.CustomerCode == EksWeighingHeader.ConsigneeCode,
            )
            .filter(EksWeighingHeader.MasterAWB == awb)
            .order_by(EksWeighingHeader.ProofNumber.desc(), EksWeighingDetail.noid.asc())
            .all()
        )

        if not rows:
            return None, []

        header = rows[0][0]
        selected_proof = header.ProofNumber
        details = [
            row[1]
            for row in rows
            if row[1] is not None and row[0].ProofNumber == selected_proof
        ]

        header.shipper = rows[0][2]
        header.consignee = rows[0][3]

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
            .join(
                EksBuildUpDetail, EksBuildupHeader.buildup_number == EksBuildUpDetail.BuildUpNumber
            )
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
