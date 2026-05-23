import re

import pycountry
from sqlalchemy import and_, bindparam, func, or_, text
from sqlalchemy.orm import Session, aliased, joinedload
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.models.BaseDB1.build_up_check_detail import BuildUpCheckDetail
from app.models.BaseDB1.build_up_check_header import BuildUpCheckHeader
from app.models.BaseDB1.fwb import Fwb
from app.models.BaseDB2.eks_hostawb import EksHostAWB
from app.models.BaseDB2.eks_invoiceheader import EksInvoiceHeader
from app.models.BaseDB2.eks_masterwaybill import EksMasterWaybill
from app.models.BaseDB2.imp_breakdowndetail import ImpBreakdownDetail
from app.models.BaseDB2.imp_hostawb import ImpHostAWB
from app.models.BaseDB2.imp_masterwaybill import ImpMasterWaybill
from app.models.BaseDB2.mst_customer import MstCustomer
from app.models.BaseDB2.weighing_detail_model import EksWeighingDetail
from app.models.BaseDB2.weighing_header_model import EksWeighingHeader
from app.schemas.awb_mawb_schema import AwbMawbResponse
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
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
    def __init__(self, db: Session, legacy_db: Session | None = None):
        self.db = db
        self.legacy_db = legacy_db or db

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

        total_records_query = self.db.query(
            func.count(func.distinct(EksWeighingHeader.MasterAWB))
        )
        total_records = total_records_query.scalar()
        filtered_records_query = base_query.with_entities(
            func.count(func.distinct(EksWeighingHeader.MasterAWB))
        )
        filtered_records = filtered_records_query.scalar()

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

        results_query = query.offset(params.start).limit(params.length)
        results = results_query.all()

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

        rows_query = (
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
        )
        rows = rows_query.all()

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
        header_query = (
            self.db.query(EksWeighingHeader)
            .filter(EksWeighingHeader.MasterAWB == awb)
            .order_by(EksWeighingHeader.noid.desc())
        )
        header = header_query.first()

        details_query = (
            self.db.query(EksWeighingDetail)
            .filter(EksWeighingDetail.MasterAWB == awb)
            .order_by(EksWeighingDetail.noid.asc())
        )
        details = details_query.all()

        primary_detail = details[0] if details else None
        host_awb = None
        if primary_detail and primary_detail.HostAWB:
            host_awb_query = self.db.query(EksHostAWB).filter(
                EksHostAWB.HostAWB == primary_detail.HostAWB
            )
            host_awb = host_awb_query.first()
        if not host_awb:
            host_awb_query = (
                self.db.query(EksHostAWB)
                .filter(EksHostAWB.MasterAWB == awb)
                .order_by(EksHostAWB.noid.asc())
            )
            host_awb = host_awb_query.first()

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
            customers_query = self.db.query(MstCustomer).filter(
                MstCustomer.CustomerCode.in_(customer_codes)
            )
            customers_list = customers_query.all()
            customers = {item.CustomerCode: item for item in customers_list}

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

        rows_query = (
            self.db.query(EksMasterWaybill, EksHostAWB, agen_customer, shipper_customer)
            .join(EksHostAWB, EksMasterWaybill.MasterAWB == EksHostAWB.MasterAWB)
            .join(agen_customer, EksMasterWaybill.AgenCode == agen_customer.CustomerCode)
            .join(shipper_customer, EksMasterWaybill.ShipperCode == shipper_customer.CustomerCode)
            .filter(EksMasterWaybill.MasterAWB == mawb)
        )
        rows = rows_query.all()

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
        master_query = self.db.query(ImpMasterWaybill).filter(
            ImpMasterWaybill.MasterAWB == mawb
        )
        master = master_query.first()
        if not master:
            return None
        return ImpMasterWaybillOut.model_validate(master)

    def get_imp_hostawb(self, mawb: str) -> list[ImpHostAWBOut]:
        breakdown_query = self.db.query(ImpBreakdownDetail).filter(
            ImpBreakdownDetail.MasterAWB == mawb
        )
        breakdown = breakdown_query.first()
        has_breakdown = breakdown is not None
        has_obdetail = (
            self.db.execute(
                text("SELECT 1 FROM imp_obdetail WHERE MasterAWB = :mawb LIMIT 1"),
                {"mawb": mawb},
            ).first()
            is not None
        )
        host_awbs_query = (
            self.db.query(ImpHostAWB)
            .filter(ImpHostAWB.MasterAWB == mawb)
            .order_by(ImpHostAWB.created_at.asc())
        )
        host_awbs = host_awbs_query.all()
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



    def get_fwb_by_mawb(self, mawb: str) -> Fwb | None:
        """Fetch persisted FWB data for a MAWB from DB1."""
        return self.db.query(Fwb).filter(Fwb.mawb == mawb).first()

    def upsert_fwb(self, mawb: str, values: dict[str, object]) -> Fwb:
        """Insert or update a FWB record and commit the transaction."""
        record = self.get_fwb_by_mawb(mawb)
        if record:
            for key, value in values.items():
                setattr(record, key, value)
        else:
            record = Fwb(**values)
            self.db.add(record)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record

    def list_ffm_build_up_headers(
        self,
        params: DataTablesParams,
    ) -> tuple[int, int, list[BuildUpCheckHeader]]:
        """Return Build Up Check headers for FFM DataTables."""
        query = self.db.query(BuildUpCheckHeader)
        total_records = self.db.query(func.count(BuildUpCheckHeader.id)).scalar() or 0

        joined_detail = False
        if params.filters:
            filters = params.filters
            number_value = getattr(filters, "number", None) or getattr(
                filters,
                "number_build_up",
                None,
            )
            if number_value:
                needle = f"%{number_value}%"
                query = query.filter(
                    or_(
                        BuildUpCheckHeader.uld.like(needle),
                        BuildUpCheckHeader.flight_no.like(needle),
                    )
                )

            mawb_value = getattr(filters, "mawb", None)
            if mawb_value:
                query = query.join(BuildUpCheckDetail)
                joined_detail = True
                query = query.filter(BuildUpCheckDetail.mawb.like(f"%{mawb_value}%"))

            airlines_value = getattr(filters, "airlines_code", None) or getattr(
                filters,
                "airlines",
                None,
            )
            if airlines_value:
                query = query.filter(BuildUpCheckHeader.airlines.like(f"%{airlines_value}%"))

            flight_date_value = getattr(filters, "flight_date", None)
            if flight_date_value:
                query = query.filter(BuildUpCheckHeader.flight_date == flight_date_value)

            dest_value = getattr(filters, "dest", None)
            if dest_value:
                query = query.filter(BuildUpCheckHeader.dest.like(f"%{dest_value}%"))

        if params.search.value:
            if not joined_detail:
                query = query.outerjoin(BuildUpCheckDetail)
                joined_detail = True
            search_value = f"%{params.search.value}%"
            query = query.filter(
                or_(
                    BuildUpCheckHeader.uld.like(search_value),
                    BuildUpCheckHeader.airlines.like(search_value),
                    BuildUpCheckHeader.flight_no.like(search_value),
                    BuildUpCheckHeader.dest.like(search_value),
                    BuildUpCheckDetail.mawb.like(search_value),
                )
            )

        filtered_records = (
            query.with_entities(func.count(func.distinct(BuildUpCheckHeader.id))).scalar() or 0
        )

        rows = (
            query.options(
                joinedload(BuildUpCheckHeader.details).joinedload(BuildUpCheckDetail.rincian)
            )
            .order_by(BuildUpCheckHeader.flight_date.desc(), BuildUpCheckHeader.id.desc())
            .distinct()
            .offset(params.start)
            .limit(params.length)
            .all()
        )
        return int(total_records), int(filtered_records), rows

    def get_ffm_build_up_header_by_id(self, header_id: int) -> BuildUpCheckHeader | None:
        """Return one Build Up Check header with MAWB and rincian rows."""
        return (
            self.db.query(BuildUpCheckHeader)
            .options(
                joinedload(BuildUpCheckHeader.details).joinedload(BuildUpCheckDetail.rincian)
            )
            .filter(BuildUpCheckHeader.id == header_id)
            .first()
        )

    def get_legacy_weighing_header(
        self,
        mawb: str,
        flight_no: str | None = None,
        flight_date: object | None = None,
    ) -> EksWeighingHeader | None:
        """
        Return latest legacy weighing header for fallback FFM attributes.

        Strategi pencarian (DB2 — READ ONLY / SSoT):
        1. Cari dengan MasterAWB + FlightNumber LIKE flight_no + DateOfFlight LIKE flight_date.
        2. Jika tidak ditemukan, cari dengan MasterAWB + DateOfFlight saja (tanpa filter flight_no).
        3. Jika masih tidak ditemukan, fallback ke MasterAWB saja (ambil record terbaru).

        Args:
            mawb: Nomor Master AWB.
            flight_no: Nomor penerbangan (opsional, bisa berbeda format di DB).
            flight_date: Tanggal penerbangan (opsional).

        Returns:
            EksWeighingHeader terbaru yang cocok, atau None jika tidak ditemukan.
        """
        if not mawb:
            return None

        base_query = self.legacy_db.query(EksWeighingHeader).filter(
            EksWeighingHeader.MasterAWB == mawb
        )

        # Attempt 1: filter ketat dengan flight_no dan flight_date
        if flight_no or flight_date:
            strict_query = base_query
            if flight_no:
                strict_query = strict_query.filter(
                    EksWeighingHeader.FlightNumber.like(f"%{flight_no}%")
                )
            if flight_date:
                date_text = str(flight_date)[:10]
                strict_query = strict_query.filter(
                    EksWeighingHeader.DateOfFlight.like(f"%{date_text}%")
                )
            result = strict_query.order_by(EksWeighingHeader.noid.desc()).first()
            if result:
                return result

        # Attempt 2: filter dengan flight_date saja (jika flight_no tidak cocok formatnya)
        if flight_date:
            date_text = str(flight_date)[:10]
            result = (
                base_query
                .filter(EksWeighingHeader.DateOfFlight.like(f"%{date_text}%"))
                .order_by(EksWeighingHeader.noid.desc())
                .first()
            )
            if result:
                return result

        # Attempt 3: fallback MasterAWB saja — ambil record terbaru
        return base_query.order_by(EksWeighingHeader.noid.desc()).first()

    def get_legacy_invoice_by_mawb(self, mawb: str) -> EksInvoiceHeader | None:
        """
        Ambil invoice header terbaru berdasarkan MasterAWB via relasi:
        eks_weighingheader.InvoiceNumber = eks_invoiceheader.InvoiceNumber

        Digunakan sebagai fallback terakhir untuk data pieces dan weight
        pada proses generate FFM Cargo-IMP.

        PENTING: DB2 adalah SSoT — query ini READ ONLY.

        Args:
            mawb: Nomor Master AWB.

        Returns:
            EksInvoiceHeader terbaru yang terhubung ke MAWB, atau None.
        """
        if not mawb:
            return None
        return (
            self.legacy_db.query(EksInvoiceHeader)
            .join(
                EksWeighingHeader,
                EksWeighingHeader.InvoiceNumber == EksInvoiceHeader.InvoiceNumber,
            )
            .filter(EksWeighingHeader.MasterAWB == mawb)
            .order_by(EksWeighingHeader.noid.desc())
            .first()
        )

    def list_legacy_weighing_details(self, mawb: str) -> list[EksWeighingDetail]:
        """
        Return legacy weighing detail rows for one MAWB.

        PENTING: DB2 adalah SSoT — READ ONLY.

        Args:
            mawb: Nomor Master AWB.

        Returns:
            List EksWeighingDetail diurutkan by noid ascending.
        """
        if not mawb:
            return []
        return (
            self.legacy_db.query(EksWeighingDetail)
            .filter(EksWeighingDetail.MasterAWB == mawb)
            .order_by(EksWeighingDetail.noid.asc())
            .all()
        )

    def list_legacy_host_awbs(self, mawb: str) -> list[EksHostAWB]:
        """
        Return legacy host AWB rows for one MAWB.

        PENTING: DB2 adalah SSoT — READ ONLY.

        Args:
            mawb: Nomor Master AWB.

        Returns:
            List EksHostAWB diurutkan by noid ascending.
        """
        if not mawb:
            return []
        return (
            self.legacy_db.query(EksHostAWB)
            .filter(EksHostAWB.MasterAWB == mawb)
            .order_by(EksHostAWB.noid.asc())
            .all()
        )

    def sum_legacy_weighing_volume_by_mawb(self, mawb: str) -> float | None:
        """
        Jumlahkan TotalVolume dari SEMUA baris eks_weighingheader untuk satu MasterAWB.

        Digunakan sebagai fallback utama volume pada FFM Cargo-IMP karena
        satu MAWB bisa memiliki beberapa baris eks_weighingheader
        (berbeda ProofNumber). Nilai TotalVolume masing-masing baris dijumlah.

        PENTING: DB2 adalah SSoT — READ ONLY.

        Args:
            mawb: Nomor Master AWB.

        Returns:
            Total volume (float) dari seluruh baris, atau None jika tidak ada data.
        """
        if not mawb:
            return None
        result = (
            self.legacy_db.query(func.sum(EksWeighingHeader.TotalVolume))
            .filter(
                EksWeighingHeader.MasterAWB == mawb,
                EksWeighingHeader.void.is_(False),
            )
            .scalar()
        )
        if result is not None:
            val = float(result)
            return val if val > 0 else None
        return None

    def sum_legacy_weighing_detail_volume_by_mawb(self, mawb: str) -> float | None:
        """
        Jumlahkan VolumeCargo dari SEMUA baris eks_weighingdetail untuk satu MasterAWB.

        Fallback tambahan jika TotalVolume di eks_weighingheader tidak tersedia.
        Menjumlahkan volume per item/detail sehingga hasilnya lebih granular.

        PENTING: DB2 adalah SSoT — READ ONLY.

        Args:
            mawb: Nomor Master AWB.

        Returns:
            Total volume (float) dari seluruh baris detail, atau None jika tidak ada data.
        """
        if not mawb:
            return None
        result = (
            self.legacy_db.query(func.sum(EksWeighingDetail.VolumeCargo))
            .filter(EksWeighingDetail.MasterAWB == mawb)
            .scalar()
        )
        if result is not None:
            val = float(result)
            return val if val > 0 else None
        return None

