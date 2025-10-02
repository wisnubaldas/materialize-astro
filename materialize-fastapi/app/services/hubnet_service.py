import requests
from fastapi import Depends, UploadFile
from openpyxl import load_workbook
from requests.auth import HTTPBasicAuth
from sqlalchemy import and_, case, func, literal_column, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.db.mysql import SessionDB1R, SessionDB1W, get_db1_w
from app.models.hubnet_request import HubnetRequest
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.delete_data_terkirim_schema import DeleteDataTerkirimSchema
from app.schemas.hubnet_request_schema import HubnetRequestGet
from app.services.datatables_service import DataTablesService
from app.utils.env import ENV


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
    def upload_manifest(file: UploadFile, db: Session = Depends(get_db1_w)):
        wb = load_workbook(filename=file.path, read_only=True)
        ws = wb.active
        batch = []
        batch_size = 500  # jumlah row per insert

        for _idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=1):
            AWB_NO, FLT_DATE, FLT_NUMBER, IS_INTERNATIONAL, IS_EKSPOR = row

            batch.append(
                HubnetRequest,
                AWB_NO=AWB_NO,
                FLT_DATE=FLT_DATE,
                FLT_NUMBER=FLT_NUMBER,
                IS_INTERNATIONAL=IS_INTERNATIONAL,
                IS_EKSPOR=IS_EKSPOR,
            )
            if len(batch) == batch_size:
                db.bulk_save_objects(batch)
                db.commit()
                batch = []

        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        return {"message": "berhasil upload data"}

        # content = file.file.read()

        # try:
        #     df = pd.read_excel(io.BytesIO(content))
        # except Exception as e:
        #     raise HTTPException(status_code=400, detail=f"invalid file format: {e}")

        # data_prevew = df.head(5).to_dict(orient="records")

        # return {
        #     "filename": file.filename,
        #     "row":len(df),
        #     "preview": data_prevew
        # }

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
