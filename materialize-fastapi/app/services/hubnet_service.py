from datetime import datetime
from io import BytesIO

import pytz
import requests
from fastapi import HTTPException, UploadFile
from openpyxl import load_workbook
from requests.auth import HTTPBasicAuth
from sqlalchemy import and_, case, func, literal_column, select, text
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.db.mysql import SessionDB1R, SessionDB1W, SessionDB2R
from app.models.hubnet_request import HubnetRequest
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.delete_data_terkirim_schema import DeleteDataTerkirimSchema
from app.schemas.hubnet_request_schema import HubnetRequestGet
from app.services.datatables_service import DataTablesService
from app.utils.env import ENV
from app.utils.helper import HELPER


class HbnetRequestService:
    @staticmethod
    def get_data_request(
        db: Session, params: DataTablesParams
    ) -> DataTablesResponse[HubnetRequestGet]:
        data_request = DataTablesService(
            model=HubnetRequest,
            schema=HubnetRequestGet,
            search_columns=["AWB_NO", "FLT_DATE", "FLT_NUMBER", "IS_INTERNATIONAL", "IS_EKSPOR"],
            custom_filters=["AWB_NO", "FLT_DATE", "FLT_NUMBER", "IS_INTERNATIONAL", "IS_EKSPOR"],
        )
        return data_request.get_datatable(db=db, params=params)

    @staticmethod
    def upload_manifest(file: UploadFile, db: Session):  # noqa: PLR0912, PLR0915
        # validasi ekstensi
        if not file.filename.endswith((".xlsx", ".xlsm")):
            raise HTTPException(
                status_code=400, detail="Format file tidak valid, gunakan Excel (.xlsx / .xlsm)"
            )

        contents = file.file.read()
        wb = load_workbook(filename=BytesIO(contents), read_only=True)
        ws = wb.active

        # validasi header
        expected_headers = [
            "AWB_NO",
            "FLT_NUMBER",
            "FLT_DATE",
            "ORI",
            "DEST",
            "T",
            "K",
            "CH_WEIGHT",
            "MC",
            "KATEGORI_CARGO",
        ]
        headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
        if headers != expected_headers:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Header file tidak sesuai !",
                    "error": {"header_file_upload": headers, "header_file_valid": expected_headers},
                },
            )

        batch = []
        batch_size = 500

        for idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not any(row):
                continue
            AWB_NO, FLT_NUMBER, FLT_DATE, ORI, DEST, T, K, CH_WEIGHT, MC, KATEGORI_CARGO = row

            # validasi kolom wajib
            if (
                not AWB_NO
                or not FLT_NUMBER
                or not FLT_DATE
                or not ORI
                or not DEST
                or not T
                or not K
                or not MC
                or not KATEGORI_CARGO
            ):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": f"Data tidak lengkap di baris {idx}",
                        "error": {
                            "header_file_upload": headers,
                            "header_file_valid": expected_headers,
                        },
                    },
                )
            customer = None
            # mapping kategori cargo ke IS_INTERNATIONAL dan IS_EKSPOR
            if KATEGORI_CARGO == "EKSPORT":
                IS_INTERNATIONAL, IS_EKSPOR = 1, 1
                customer = HbnetRequestService.__get_hostawb(
                    awb=AWB_NO, qfile="app/services/query/get_ekspor_hawb.sql"
                )
                REMARKS = customer.get("descriptiongoods") if customer else None
                AGT_NAME = customer.get("AgenCode") if customer else None
                SHP_ADD = customer.get("shipperaddress") if customer else None
                SHP_NAME = customer.get("shippername") if customer else None
                CNE_NAME = customer.get("Consigneename") if customer else None
                CNE_ADD = customer.get("Consigneeaddress") if customer else None
            elif KATEGORI_CARGO == "IMPORT":
                IS_INTERNATIONAL, IS_EKSPOR = 1, 0
                customer = HbnetRequestService.__get_hostawb(
                    awb=AWB_NO, qfile="app/services/query/get_imp_hostawb.sql"
                )
                REMARKS = customer.get("descriptiongoods") if customer else None
                AGT_NAME = customer.get("AgenCode") if customer else None
                SHP_ADD = customer.get("shipperaddress") if customer else None
                SHP_NAME = customer.get("shippername") if customer else None
                CNE_NAME = customer.get("Consigneename") if customer else None
                CNE_ADD = customer.get("Consigneeaddress") if customer else None
            elif KATEGORI_CARGO == "OUTGOING":
                IS_INTERNATIONAL, IS_EKSPOR = 0, 1
            elif KATEGORI_CARGO == "INCOMING":
                IS_INTERNATIONAL, IS_EKSPOR = 0, 0
            else:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": f"Kategori cargo tidak valid di baris {idx}: {KATEGORI_CARGO}",
                        "error": {
                            "header_file_upload": headers,
                            "header_file_valid": expected_headers,
                        },
                    },
                )

            # tambahin jam ke FLT_DATE
            if isinstance(FLT_DATE, datetime):
                flt_datetime = FLT_DATE
            else:
                try:
                    base_date = datetime.strptime(str(FLT_DATE), "%d-%m-%Y")  # noqa: DTZ007
                    tz = pytz.timezone("Asia/Jakarta")
                    now = datetime.now(tz)
                    flt_datetime = base_date.replace(
                        hour=now.hour, minute=now.minute, second=now.second
                    )
                except Exception:
                    raise ValueError(f"Baris {idx}: format tanggal tidak valid ({FLT_DATE})")  # noqa: B904

            batch.append(
                HubnetRequest(
                    AWB_NO=AWB_NO,
                    FLT_NUMBER=FLT_NUMBER,
                    FLT_DATE=flt_datetime,
                    ORI=ORI,
                    DEST=DEST,
                    T=T,
                    K=K,
                    CH_WEIGHT=CH_WEIGHT,
                    MC=MC,
                    IS_INTERNATIONAL=IS_INTERNATIONAL,
                    IS_EKSPOR=IS_EKSPOR,
                    FLT_NUMBER1=FLT_NUMBER,
                    FLT_DATE1=flt_datetime,
                    ORI1=ORI,
                    AGT_NAME=AGT_NAME,
                    AGT_ADD="",
                    SHP_ADD=SHP_ADD,
                    SHP_NAME=SHP_NAME,
                    CNE_NAME=CNE_NAME,
                    CNE_ADD=CNE_ADD,
                    KATEGORI_CARGO=KATEGORI_CARGO,
                    COMMODITY="",
                    CARGO_TREATMENT="",
                    REMARKS=REMARKS,
                )
            )

            if len(batch) == batch_size:
                db.bulk_save_objects(batch)
                db.commit()
                batch = []

        # save sisa dari batch
        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        return {"message": "Upload berhasil"}

    @staticmethod
    def dashboard_card():
        # kriteria
        IS_INTERNATIONAL_TRUE = HubnetRequest.IS_INTERNATIONAL == "1"
        IS_INTERNATIONAL_FALSE = HubnetRequest.IS_INTERNATIONAL == "0"
        IS_EXPORT_TRUE = HubnetRequest.IS_EKSPOR == "1"
        IS_EXPORT_FALSE = HubnetRequest.IS_EKSPOR == "0"
        IS_SEND_TRUE = HubnetRequest.IS_SEND == "1"
        IS_SEND_FALSE = HubnetRequest.IS_SEND == "0"

        export_send = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_TRUE, IS_EXPORT_TRUE, IS_SEND_TRUE], label="export_send"
        )
        export_send_not = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_TRUE, IS_EXPORT_TRUE, IS_SEND_FALSE],
            label="export_send_not",
        )
        import_send = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_TRUE, IS_EXPORT_FALSE, IS_SEND_TRUE], label="import_send"
        )
        import_send_not = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_TRUE, IS_EXPORT_FALSE, IS_SEND_FALSE],
            label="import_send_not",
        )
        incoming_send = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_FALSE, IS_EXPORT_FALSE, IS_SEND_TRUE],
            label="incoming_send",
        )
        incoming_send_not = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_FALSE, IS_EXPORT_FALSE, IS_SEND_FALSE],
            label="incoming_send_not",
        )
        outgoing_send = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_FALSE, IS_EXPORT_TRUE, IS_SEND_TRUE], label="outgoing_send"
        )
        outgoing_send_not = HbnetRequestService._create_conditional_count_expression(
            conditions=[IS_INTERNATIONAL_FALSE, IS_EXPORT_TRUE, IS_SEND_FALSE],
            label="outgoing_send_not",
        )

        # kueri
        stmt = select(
            export_send,
            export_send_not,
            import_send,
            import_send_not,
            incoming_send,
            incoming_send_not,
            outgoing_send,
            outgoing_send_not,
        )
        # Eksekusi kueri

        with SessionDB1W() as session:
            result = session.execute(stmt).one()
        return {
            "export_send": result.export_send,
            "export_send_not": result.export_send_not,
            "import_send": result.import_send,
            "import_send_not": result.import_send_not,
            "incoming_send": result.incoming_send,
            "incoming_send_not": result.incoming_send_not,
            "outgoing_send": result.outgoing_send,
            "outgoing_send_not": result.outgoing_send_not,
        }

    @staticmethod
    def last_sending():
        session = SessionDB1R()
        data = (
            session.query(HubnetRequest)
            .filter(HubnetRequest.IS_SEND == "1")
            .order_by(HubnetRequest.created_at.desc())
            .first()
        )
        session.close()
        return data

    @staticmethod
    def get_data_terkirim(flt_date: str, page: int = 1, per_page: int = 10):
        try:
            payload = {"FLT_DATE": flt_date}
            response = requests.post(
                f"{ENV.HUBNET_URL}/nle-udara/get-data-logistik?page={page}&per_page={per_page}",
                data=payload,
                auth=HTTPBasicAuth(ENV.HUBNET_USER, ENV.HUBNET_PASSWORD),
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Terjadi kesalahan saat membuat permintaan: {e}")
            if hasattr(e.response, "text"):
                print(f"Respons server: {e.response.text}")

    @staticmethod
    def delete_data_terkirim_api(params: DeleteDataTerkirimSchema):
        try:
            # Konversi setiap model Pydantic di dalam list menjadi dict
            payload = [item.model_dump() for item in params]

            response = requests.post(
                f"{ENV.HUBNET_URL}/nle-udara/delete-data-logistik",
                json=payload,
                auth=HTTPBasicAuth(ENV.HUBNET_USER, ENV.HUBNET_PASSWORD),
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Terjadi kesalahan saat membuat permintaan: {e}")
            if hasattr(e.response, "text"):
                print(f"Respons server: {e.response.text}")

    @staticmethod
    def __get_hostawb(awb: str, qfile: str):
        try:
            db2 = SessionDB2R()
            query = HELPER.load_sql_query(qfile)
            param = {"awb": awb}
            sql = text(query)
            customers = db2.execute(sql, param).mappings().first()
        except Exception as e:
            print("Error :", e)
        finally:
            db2.close()

        return customers

    @staticmethod
    def _create_conditional_count_expression(
        conditions: list[ColumnElement], label: str
    ) -> ColumnElement:
        combined_condition = and_(*conditions)
        count_expression = func.sum(
            case(
                (combined_condition, literal_column("1")),  # Jika kriteria benar, hitung 1
                else_=literal_column("0"),  # Jika kriteria salah, hitung 0
            )
        ).label(label)
        return count_expression
