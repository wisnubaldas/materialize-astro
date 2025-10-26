"""Define Angkasapura-related routes that delegate work to `INVAp2Service`."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.schemas.ap2_fail_inv_schema import FailInvGet
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceDailySummary, InvoiceGet, InvoiceMonthlySummary
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.void_invoice_schema import VoidInvoiceSchemaBase, VoidInvoiceSchemaResponse
from app.services.inv_ap2_service import INVAp2Service

router = APIRouter(prefix="/angkasapura", tags=["Angkasapura"])


@router.post("/datatables", response_model=DataTablesResponse[InvoiceGet])
def angkasapura(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Return filtered invoice data by delegating to `INVAp2Service.datatable`."""
    return INVAp2Service.datatable(db=db, params=params)


@router.post("/get-data-response-inv", response_model=DataTablesResponse[ResponsInvAp2Get])
def get_data_response_inv(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Expose the invoice response datatable served by `INVAp2Service.get_response_inv`."""
    return INVAp2Service.get_response_inv(db=db, params=params)


@router.post("/data-inv-yang-tidak-lengkap", response_model=DataTablesResponse[FailInvGet])
def data_inv_yang_tidak_lengkap(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Surface incomplete invoice rows coming from `INVAp2Service.get_fail_inv`."""
    return INVAp2Service.get_fail_inv(db=db, params=params)


@router.post("/void-invoice")
async def void_invoice(params: VoidInvoiceSchemaBase, db: Session = Depends(get_db1_w)):
    """Invoke `INVAp2Service.void_invoice_ap2` to void an invoice and persist the response."""
    return await INVAp2Service.void_invoice_ap2(params, db)


@router.post("/get-void-invoice", response_model=DataTablesResponse[VoidInvoiceSchemaResponse])
def get_void_invoice(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Forward voided invoice datatable requests to `INVAp2Service.table_void_invoice`."""
    return INVAp2Service.table_void_invoice(db=db, params=params)

@router.get(
    "/search-invoice-response/{invoice_number}",
    response_model=list[ResponsInvAp2Get],
    summary="Search Invoice Response by Invoice Number",
)
def search_invoice_response(invoice_number: str, db: Session = Depends(get_db1_r)):
    """Bridge invoice response lookups to `INVAp2Service.search_invoice_response`."""
    return INVAp2Service.search_invoice_response(db=db, invoice_number=invoice_number)

@router.get(
    "/invoice-perbulan/pdf/{tgl}",
    summary="Get invoice PDF for a given month",
)
def get_invoice_pdf_perbulan(tgl: date, db: Session = Depends(get_db1_r)):
    """Fetch the latest invoice PDF by calling `INVAp2Service.get_invoice_pdf_perbulan`."""
    return {"tanggal": tgl, "tipe": str(type(tgl))}
    # return INVAp2Service.get_invoice_pdf_perbulan(db=db, tgl=tgl)
    
@router.get(
    "/invoice-perbulan/{tahun}/{bulan}",
    response_model=list[InvoiceDailySummary],
    summary="Get sent invoices per day for a given month",
)
def invoice_perbulan_detail(tahun: int, bulan: int, db: Session = Depends(get_db1_r)):
    """Expose daily invoice counts through `INVAp2Service.invoice_perbulan_detail`."""
    return INVAp2Service.invoice_perbulan_detail(db=db, tahun=tahun, bulan=bulan)


@router.get(
    "/invoice-perbulan/{tahun}",
    response_model=list[InvoiceMonthlySummary],
    summary="Get sent invoices per month for a given year",
)
def invoice_perbulan(tahun: int, db: Session = Depends(get_db1_r)):
    """Retrieve monthly aggregates via `INVAp2Service.invoice_perbulan`."""
    return INVAp2Service.invoice_perbulan(db=db, tahun=tahun)



