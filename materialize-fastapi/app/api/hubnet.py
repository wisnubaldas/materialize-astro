from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.delete_data_terkirim_schema import DeleteDataTerkirimSchema
from app.schemas.hubnet_request_schema import HubnetRequestGet
from app.services.hubnet_service import HbnetRequestService

router = APIRouter(prefix="/hubnet", tags=["Hubnet"])


@router.post("/data-terkirim", response_model=DataTablesResponse[HubnetRequestGet])
def data_terkirim(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    return HbnetRequestService.get_data_request(db=db, params=params)


@router.post("/upload-manifests")
def upload_manifests(file: UploadFile = File(...)):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Invalid file format")
    return HbnetRequestService.upload_manifest(file=file)


@router.get("/dashboard-card", summary="Ini untuk card di dashboard")
def dashboard_card():
    return HbnetRequestService.dashboard_card()


@router.get("/last-sending", summary="Data terakhir terkirim ke HUBNET")
def last_sending():
    return HbnetRequestService.last_sending()


@router.get("/get-data-terkirim/", summary="megecek data terkirim dari API HUBNET")
# ini untuk query param url
def get_data_terkirim(flt_date: str, page: int = 1, per_page: int = 10):
    return HbnetRequestService.get_data_terkirim(flt_date=flt_date, page=page, per_page=per_page)


@router.post("/delete-data-terkirim", summary="Delete data terkirim di API HUBNET")
def delete_data_terkirim(params: list[DeleteDataTerkirimSchema]):
    return HbnetRequestService.delete_data_terkirim_api(params=params)
