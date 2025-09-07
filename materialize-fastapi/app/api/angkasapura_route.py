from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.db.mysql import get_db
from app.schemas.inv_ap2_schema import InvoiceGet
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.services.inv_ap2_service import INVAp2Service
router = APIRouter(prefix="/angkasapura", tags=["Angkasapura"])

@router.post("/datatables",response_model=DataTablesResponse[InvoiceGet])
def angkasapura(params: DataTablesParams, db: Session = Depends(get_db)):
    return INVAp2Service.datatable(db=db, params=params)