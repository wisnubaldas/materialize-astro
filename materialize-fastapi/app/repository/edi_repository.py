import re

import pycountry
from sqlalchemy import and_, bindparam, func, or_, text
from sqlalchemy.orm import Session, aliased
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.models.BaseDB2.eks_buildupdetail_model import EksBuildUpDetail
from app.models.BaseDB2.eks_buildupheader import EksBuildupHeader
from app.models.BaseDB2.eks_hostawb import EksHostAWB
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.models.BaseDB2.imp_breakdowndetail import ImpBreakdownDetail
from app.models.BaseDB2.imp_hostawb import ImpHostAWB
from app.models.BaseDB2.imp_masterwaybill import ImpMasterWaybill
from app.models.BaseDB2.mst_customer import MstCustomer
from app.models.BaseDB2.weighing_detail_model import EksWeighingDetail
from app.models.BaseDB2.weighing_header_model import EksWeighingHeader
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_buildupdetail_schema import EksBuildUpDetailOut
from app.schemas.eks_buildupheader_schema import EksBuildupHeaderOut
from app.schemas.eks_hostawb import EksHostAWBOut
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.imp_hostawb import ImpHostAWBOut
from app.schemas.imp_masterwaybill import ImpMasterWaybillOut
from app.schemas.mst_customer_schema import CustomerOut
from app.schemas.weighing_header_schema import WeighingHeaderOut
from app.services.datatables_service import DataTablesService

_CUSTOMER_FIELDS = (
    "CustomerCode",
    "CompanyName",
    "PICName",
    "Address1",
    "Address2",
    "City",
    "PostCode",
    "CountryCode",
    "MobileNumber",
    "FaxNumber",
    "Phonenumber",
    "EmailAddress",
    "NPWPNumber",
    "ContactIdentifier",
    "ContactNumber",
    "EmployeeNumber",
    "flag_faktur",
    "Dom_member",
    "int_member",
    "DateEntry",
    "TimeEntry",
    "void",
)

_COUNTRY_SPLIT_RE = re.compile(r"[,/;|()]+")


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _country_code_from_token(token: str) -> str | None:
    text = _clean_text(token)
    if not text:
        return None
    upper = text.upper()
    if len(upper) == 2:
        if pycountry.countries.get(alpha_2=upper):
            return upper
        return None
    if len(upper) == 3:
        match = pycountry.countries.get(alpha_3=upper)
        return match.alpha_2 if match else None
    try:
        return pycountry.countries.lookup(text).alpha_2
    except LookupError:
        return None


def _normalize_country_code(*values: str | None) -> str | None:
    for value in values:
        text = _clean_text(value)
        if not text:
            continue
        for part in _COUNTRY_SPLIT_RE.split(text):
            code = _country_code_from_token(part)
            if code:
                return code
        code = _country_code_from_token(text)
        if code:
            return code
    return None


def _merge_customer_data(
    base: dict[str, object],
    fallback: dict[str, object],
    *,
    customer_code: str | None = None,
) -> dict[str, object]:
    if customer_code and not _clean_text(base.get("CustomerCode")):
        base["CustomerCode"] = customer_code

    for field in _CUSTOMER_FIELDS:
        if not _clean_text(base.get(field)) and _clean_text(fallback.get(field)):
            base[field] = fallback[field]

    if not _clean_text(base.get("Address1")) and _clean_text(base.get("Address2")):
        base["Address1"] = base["Address2"]
        base["Address2"] = None

    country_code = _normalize_country_code(
        base.get("CountryCode"),
        fallback.get("CountryCode"),
        base.get("Address1"),
        base.get("Address2"),
        base.get("City"),
        fallback.get("Address1"),
        fallback.get("Address2"),
        fallback.get("City"),
    )
    if country_code:
        base["CountryCode"] = country_code

    return base


def _customer_to_dict(customer: MstCustomer | None) -> dict[str, object]:
    if not customer:
        return {}
    return {field: getattr(customer, field, None) for field in _CUSTOMER_FIELDS}


def _shipper_fallback_from_hosts(host_awbs: list[EksHostAWB]) -> dict[str, object]:
    fallback: dict[str, object] = {}
    for host in host_awbs:
        if not host:
            continue
        if not _clean_text(fallback.get("CompanyName")) and _clean_text(host.shippername):
            fallback["CompanyName"] = host.shippername
        if not _clean_text(fallback.get("Address1")) and _clean_text(host.shipperaddress):
            fallback["Address1"] = host.shipperaddress
        if not _clean_text(fallback.get("City")) and _clean_text(host.shippercity):
            fallback["City"] = host.shippercity
        if not _clean_text(fallback.get("CountryCode")) and _clean_text(host.shippercountry):
            fallback["CountryCode"] = host.shippercountry
        if not _clean_text(fallback.get("PostCode")) and _clean_text(host.shipperpostal):
            fallback["PostCode"] = host.shipperpostal
        if not _clean_text(fallback.get("NPWPNumber")) and _clean_text(host.shipperTaxNo):
            fallback["NPWPNumber"] = host.shipperTaxNo
    return fallback


def _consignee_fallback_from_hosts(host_awbs: list[EksHostAWB]) -> dict[str, object]:
    fallback: dict[str, object] = {}
    for host in host_awbs:
        if not host:
            continue
        if not _clean_text(fallback.get("CompanyName")) and _clean_text(host.Consigneename):
            fallback["CompanyName"] = host.Consigneename
        if not _clean_text(fallback.get("Address1")) and _clean_text(host.Consigneeaddress):
            fallback["Address1"] = host.Consigneeaddress
        if not _clean_text(fallback.get("City")) and _clean_text(host.Consigneecity):
            fallback["City"] = host.Consigneecity
        if not _clean_text(fallback.get("CountryCode")) and _clean_text(host.Consigneecountry):
            fallback["CountryCode"] = host.Consigneecountry
    return fallback


def _dict_to_customer(data: dict[str, object]) -> MstCustomer | None:
    if not data:
        return None
    return MstCustomer(**{field: data.get(field) for field in _CUSTOMER_FIELDS})


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

        total_records = self.db.query(
            func.count(func.distinct(EksWeighingHeader.MasterAWB))
        ).scalar()
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
            row[1] for row in rows if row[1] is not None and row[0].ProofNumber == selected_proof
        ]

        shipper_data = _merge_customer_data(
            _customer_to_dict(rows[0][2]),
            {},
            customer_code=header.ShipperCode if header else None,
        )
        consignee_data = _merge_customer_data(
            _customer_to_dict(rows[0][3]),
            {},
            customer_code=header.ConsigneeCode if header else None,
        )

        header.shipper = _dict_to_customer(shipper_data)
        header.consignee = _dict_to_customer(consignee_data)

        return header, details

    def get_weighing_by_awb_for_fwb(
        self, awb: str
    ) -> tuple[EksWeighingHeader | None, list[EksWeighingDetail], MstCustomer | None]:
        header = (
            self.db.query(EksWeighingHeader)
            .filter(EksWeighingHeader.MasterAWB == awb)
            .order_by(EksWeighingHeader.noid.desc())
            .first()
        )

        details = (
            self.db.query(EksWeighingDetail)
            .filter(EksWeighingDetail.MasterAWB == awb)
            .order_by(EksWeighingDetail.noid.asc())
            .all()
        )

        primary_detail = details[0] if details else None
        host_awb = None
        if primary_detail and primary_detail.HostAWB:
            host_awb = (
                self.db.query(EksHostAWB)
                .filter(EksHostAWB.HostAWB == primary_detail.HostAWB)
                .first()
            )
        if not host_awb:
            host_awb = (
                self.db.query(EksHostAWB)
                .filter(EksHostAWB.MasterAWB == awb)
                .order_by(EksHostAWB.noid.asc())
                .first()
            )

        if not header and not details:
            return None, [], None

        shipper_code = (header.ShipperCode if header else None) or (
            host_awb.ShipperCode if host_awb else None
        )
        consignee_code = (header.ConsigneeCode if header else None) or (
            host_awb.ConsigneeCode if host_awb else None
        )
        agent_code = (header.AgenCode if header else None) or (
            host_awb.AgenCode if host_awb else None
        )

        customer_codes = {code for code in [shipper_code, consignee_code, agent_code] if code}
        customers = {}
        if customer_codes:
            customers = {
                item.CustomerCode: item
                for item in self.db.query(MstCustomer)
                .filter(MstCustomer.CustomerCode.in_(customer_codes))
                .all()
            }

        shipper_customer = customers.get(shipper_code)
        consignee_customer = customers.get(consignee_code)
        agent_customer = customers.get(agent_code)

        shipper_fallback = _shipper_fallback_from_hosts([host_awb] if host_awb else [])
        consignee_fallback = _consignee_fallback_from_hosts([host_awb] if host_awb else [])

        shipper_data = _merge_customer_data(
            _customer_to_dict(shipper_customer),
            shipper_fallback,
            customer_code=shipper_code,
        )
        consignee_data = _merge_customer_data(
            _customer_to_dict(consignee_customer),
            consignee_fallback,
            customer_code=consignee_code,
        )
        agent_fallback = (
            shipper_fallback if shipper_code and agent_code == shipper_code else {}
        )
        agent_data = _merge_customer_data(
            _customer_to_dict(agent_customer),
            agent_fallback,
            customer_code=agent_code,
        )

        shipper_customer = _dict_to_customer(shipper_data)
        consignee_customer = _dict_to_customer(consignee_data)
        agent_customer = _dict_to_customer(agent_data)

        if header:
            header.shipper = shipper_customer
            header.consignee = consignee_customer

        agent = agent_customer or shipper_customer

        return header, details, agent

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
        host_awbs = [row[1] for row in rows]
        agen = rows[0][2]
        shipper = rows[0][3]

        shipper_fallback = _shipper_fallback_from_hosts(host_awbs)
        shipper_data = _merge_customer_data(
            _customer_to_dict(shipper),
            shipper_fallback,
            customer_code=master.ShipperCode if master else None,
        )

        agen_fallback = shipper_fallback if master and master.AgenCode == master.ShipperCode else {}
        agen_data = _merge_customer_data(
            _customer_to_dict(agen),
            agen_fallback,
            customer_code=master.AgenCode if master else None,
        )

        return AwbMawbResponse(
            master=EksMasterWaybillOut.model_validate(master),
            host_awbs=[EksHostAWBOut.model_validate(item) for item in host_awbs],
            agen=CustomerOut.model_validate(agen_data) if agen_data else None,
            shipper=CustomerOut.model_validate(shipper_data) if shipper_data else None,
        )

    def get_imp_masterwaybill(self, mawb: str) -> ImpMasterWaybillOut | None:
        master = self.db.query(ImpMasterWaybill).filter(ImpMasterWaybill.MasterAWB == mawb).first()
        if not master:
            return None
        return ImpMasterWaybillOut.model_validate(master)

    def get_imp_hostawb(self, mawb: str) -> list[ImpHostAWBOut]:
        breakdown = (
            self.db.query(ImpBreakdownDetail)
            .filter(ImpBreakdownDetail.MasterAWB == mawb)
            .first()
        )
        has_breakdown = breakdown is not None
        has_obdetail = (
            self.db.execute(
                text("SELECT 1 FROM imp_obdetail WHERE MasterAWB = :mawb LIMIT 1"),
                {"mawb": mawb},
            ).first()
            is not None
        )
        host_awbs = (
            self.db.query(ImpHostAWB)
            .filter(ImpHostAWB.MasterAWB == mawb)
            .order_by(ImpHostAWB.created_at.asc())
            .all()
        )
        delivered_hosts = set()
        host_awb_codes = [item.HostAWB for item in host_awbs if item.HostAWB]
        if host_awb_codes:
            rows = self.db.execute(
                text(
                    "SELECT DISTINCT HostMawb FROM imp_deliorderdetail "
                    "WHERE HostMawb IN :host_awbs"
                ).bindparams(bindparam("host_awbs", expanding=True)),
                {"host_awbs": host_awb_codes},
            ).all()
            delivered_hosts = {row[0] for row in rows if row and row[0]}
        if has_breakdown:
            for item in host_awbs:
                item.RCF = True
                item.DateEntry = breakdown.DateOfBreakdown  # "2025-01-01"
                item.TimeEntry = breakdown.TimeOfBreakdown  # "08:56:01"
        if has_obdetail:
            for item in host_awbs:
                item.TFD = True
        if delivered_hosts:
            for item in host_awbs:
                if item.HostAWB in delivered_hosts:
                    item.DLV = True
        return [ImpHostAWBOut.model_validate(item) for item in host_awbs]

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
