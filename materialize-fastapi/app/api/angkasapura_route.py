from fastapi import APIRouter,Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.mysql import get_db1_r
from app.schemas.inv_ap2_schema import InvoiceGet
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.services.inv_ap2_service import INVAp2Service

router = APIRouter(prefix="/angkasapura", tags=["Angkasapura"])

@router.post("/datatables",response_model=DataTablesResponse[InvoiceGet])
def angkasapura(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    return INVAp2Service.datatable(db=db, params=params)

@router.post("/get-data-response-inv",response_model=DataTablesResponse[ResponsInvAp2Get])
def get_data_response_inv(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    return  INVAp2Service.get_response_inv(db=db, params=params)

@router.post("/data-inv-yang-tidak-lengkap",response_model=DataTablesResponse[FailInvGet])
def data_inv_yang_tidak_lengkap(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    return  INVAp2Service.get_fail_inv(db=db, params=params)

@router.post("/send-invoices/{date_prefix}")
async def send_invoices(date_prefix: str):
    try:
        result = await INVAp2Service.send_invoice(date_prefix)
        return {"status": "ok", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))