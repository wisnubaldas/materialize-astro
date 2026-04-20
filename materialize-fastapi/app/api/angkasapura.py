"""Define Angkasapura routes used by frontend pages."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.inv_ap2_schema import InvoiceGet, InvoiceStatusSummary
from app.schemas.invoice_daily_counter_schema import (
    InvoiceDailyCounterGet,
    InvoiceDailyCounterMonthlySummary,
)
from app.schemas.respons_inv_ap2_schema import ResponsInvAp2Get
from app.schemas.void_invoice_schema import VoidInvoiceSchemaBase, VoidInvoiceSchemaResponse
from app.services.angkasapura_service import INVAp2Service

router = APIRouter(prefix="/angkasapura", tags=["Angkasapura"])


@router.post("/datatables", response_model=DataTablesResponse[InvoiceGet])
def angkasapura(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Return filtered invoice data."""
    return INVAp2Service.datatable(db=db, params=params)


@router.post(
    "/upload-invoice-excel",
    status_code=202,
    summary="Upload Excel invoice AP2 via background job (template mastersiogo)",
)
def upload_invoice_excel(file: UploadFile = File(...)):
    """Start background job upload excel invoice AP2 dengan validasi format template."""
    return INVAp2Service.start_upload_invoice_excel_job(file=file)


@router.get("/upload-invoice-excel/status", summary="Status job upload Excel invoice AP2")
def upload_invoice_excel_status():
    """Get latest status for upload excel invoice AP2 job."""
    return INVAp2Service.get_upload_invoice_excel_job_status()


@router.post(
    "/response-invoice/datatables",
    response_model=DataTablesResponse[ResponsInvAp2Get],
    summary="Datatable response invoice AP2",
)
def response_invoice_datatables(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Serve datatable data from table `respons_inv_ap2`."""
    return INVAp2Service.get_response_inv(db=db, params=params)


@router.post(
    "/report-invoice/datatables",
    response_model=DataTablesResponse[InvoiceDailyCounterGet],
    summary="Datatable report invoice harian",
)
def report_invoice_datatables(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    """Serve datatable report invoice dari tabel `invoice_daily_counter`."""
    return INVAp2Service.report_invoice_daily_counter(db=db, params=params)


@router.get(
    "/report-invoice/monthly/{tahun}",
    response_model=list[InvoiceDailyCounterMonthlySummary],
    summary="Grafik invoice bulanan dari invoice_daily_counter",
)
def report_invoice_monthly(tahun: int, db: Session = Depends(get_db1_r)):
    """Serve grafik report invoice per bulan dari tabel `invoice_daily_counter`."""
    return INVAp2Service.report_invoice_monthly(db=db, tahun=tahun)


@router.get(
    "/report-invoice/status-summary",
    response_model=InvoiceStatusSummary,
    summary="Ringkasan status terkirim vs belum terkirim dari inv_ap2",
)
def report_invoice_status_summary(tanggal: str | None = None, db: Session = Depends(get_db1_r)):
    """Serve ringkasan status invoice dari tabel `inv_ap2`."""
    return INVAp2Service.report_invoice_status_summary(db=db, tanggal=tanggal)


@router.post("/void-invoice", response_model=VoidInvoiceSchemaResponse)
async def void_invoice(params: VoidInvoiceSchemaBase, db: Session = Depends(get_db1_w)):
    """Void invoice AP2 dan update flag void pada inv_ap2 jika sukses."""
    return await INVAp2Service.void_invoice_ap2(params, db)
