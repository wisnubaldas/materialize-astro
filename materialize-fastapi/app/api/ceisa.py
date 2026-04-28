"""API endpoint untuk operasi CEISA."""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile, status

from app.dependencies.ceisa_reference_code_deps import (
    get_ceisa_oauth_service_w,
    get_ceisa_reference_code_service_r,
    get_ceisa_sync_job_service_w,
)
from app.dependencies.ceisa_xray_photo_deps import get_ceisa_xray_photo_service_w
from app.integrations.ceisa.oauth import CeisaOAuthService
from app.integrations.ceisa.sync_job import CeisaSyncJobService
from app.integrations.ceisa.xray_photo_service import CeisaXrayPhotoService
from app.job.ceisa_sync_job import run_ceisa_reference_sync_job
from app.job.ceisa_xray_photo_job import run_ceisa_xray_photo_job
from app.schemas.ceisa_xray_photo_schema import (
    CeisaXrayPhotoEnqueueResult,
    CeisaXrayPhotoJobStatus,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_code_schema import (
    CeisaOAuthLoginProbeResult,
    CeisaReferenceCatalogItem,
    CeisaReferenceCodeSyncEnqueueResult,
    CeisaReferenceCodeSyncJobStatus,
    MstCeisaReferenceCodeOut,
)
from app.services.ceisa_reference_code_service import CeisaReferenceCodeService

router = APIRouter(prefix="/ceisa", tags=["CEISA Master Data"])


@router.post(
    "/oauth/login-test",
    summary="Uji login OAuth2 CEISA",
    response_model=CeisaOAuthLoginProbeResult,
)
def test_ceisa_oauth_login(
    oauth_service: CeisaOAuthService = Depends(get_ceisa_oauth_service_w),
):
    """Coba login ke CEISA OAuth2 untuk validasi konfigurasi env."""
    result = oauth_service.login_probe()
    return CeisaOAuthLoginProbeResult(**result)


@router.get(
    "/reference-codes/catalog",
    summary="Daftar kategori master referensi CEISA",
    response_model=list[CeisaReferenceCatalogItem],
)
def list_reference_catalog(
    service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service_r),
):
    """Daftar kategori referensi CEISA yang didukung."""
    return service.list_catalog()


@router.get(
    "/reference-codes/{reference_slug}",
    summary="List master referensi CEISA berdasarkan kategori",
    response_model=list[MstCeisaReferenceCodeOut],
)
def list_reference_codes(
    reference_slug: str,
    service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service_r),
):
    """Daftar master referensi CEISA per kategori."""
    return service.list_by_reference_slug(reference_slug)


@router.post(
    "/reference-codes/{reference_slug}/datatables",
    summary="Datatable master referensi CEISA berdasarkan kategori",
    response_model=DataTablesResponse[MstCeisaReferenceCodeOut],
)
def datatable_reference_codes(
    reference_slug: str,
    params: DataTablesParams,
    service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service_r),
):
    """Datatable master referensi CEISA per kategori."""
    return service.datatable(reference_slug, params)


@router.post(
    "/reference-codes/{reference_slug}/sync",
    summary="Enqueue sinkronisasi master referensi CEISA via background job",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=CeisaReferenceCodeSyncEnqueueResult,
)
def sync_reference_codes(
    reference_slug: str,
    background_tasks: BackgroundTasks,
    service: CeisaSyncJobService = Depends(get_ceisa_sync_job_service_w),
):
    """Enqueue sinkronisasi snapshot kategori referensi CEISA."""
    job = service.enqueue_reference_sync(reference_slug)
    background_tasks.add_task(run_ceisa_reference_sync_job, int(job.id))
    return CeisaReferenceCodeSyncEnqueueResult(
        job_id=int(job.id),
        reference_slug=job.reference_slug,
        reference_name=job.reference_name,
        status=job.status,
        message="Job sinkronisasi CEISA berhasil diantrikan",
    )


@router.get(
    "/reference-codes/sync-jobs/{job_id}",
    summary="Status job sinkronisasi referensi CEISA",
    response_model=CeisaReferenceCodeSyncJobStatus,
)
def get_sync_job_status(
    job_id: int,
    service: CeisaSyncJobService = Depends(get_ceisa_sync_job_service_w),
):
    """Ambil status dan ringkasan hasil job sinkronisasi CEISA."""
    job = service.get_job(job_id)
    return CeisaReferenceCodeSyncJobStatus(
        job_id=int(job.id),
        reference_slug=job.reference_slug,
        reference_name=job.reference_name,
        status=job.status,
        requested_at=job.requested_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        inserted=job.inserted_count,
        updated=job.updated_count,
        deactivated=job.deactivated_count,
        total_snapshot=job.total_snapshot,
        total_active=job.total_active,
        error_message=job.error_message,
    )


@router.post(
    "/xray/kirim-foto-xray",
    summary="Enqueue kirim foto X-Ray CEISA via background job",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=CeisaXrayPhotoEnqueueResult,
)
def enqueue_kirim_foto_xray(
    background_tasks: BackgroundTasks,
    data: str = Form(..., description="JSON string payload part `data`"),
    images: list[UploadFile] = File(..., description="Daftar file image (multipart field `images`)"),
    service: CeisaXrayPhotoService = Depends(get_ceisa_xray_photo_service_w),
):
    """Enqueue request kirim foto X-Ray CEISA."""
    job = service.enqueue_request(payload_json=data, images=images)
    background_tasks.add_task(run_ceisa_xray_photo_job, int(job.id))
    return CeisaXrayPhotoEnqueueResult(
        job_id=int(job.id),
        status=job.status,
        message="Request kirim foto X-Ray CEISA berhasil diantrikan",
        nomor_aju=job.nomor_aju,
        nomor_bl_awb=job.nomor_bl_awb,
        tanggal_bl_awb=job.tanggal_bl_awb,
        kode_kantor=job.kode_kantor,
        images_count=int(job.images_count or 0),
    )


@router.get(
    "/xray/jobs/{job_id}",
    summary="Status job kirim foto X-Ray CEISA",
    response_model=CeisaXrayPhotoJobStatus,
)
def get_kirim_foto_xray_job(
    job_id: int,
    service: CeisaXrayPhotoService = Depends(get_ceisa_xray_photo_service_w),
):
    """Ambil status job kirim foto X-Ray CEISA."""
    job = service.get_job(job_id)
    return CeisaXrayPhotoJobStatus(
        job_id=int(job.id),
        status=job.status,
        nomor_aju=job.nomor_aju,
        nomor_bl_awb=job.nomor_bl_awb,
        tanggal_bl_awb=job.tanggal_bl_awb,
        kode_kantor=job.kode_kantor,
        images_count=int(job.images_count or 0),
        requested_at=job.requested_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        ceisa_response_code=job.ceisa_response_code,
        ceisa_response_message=job.ceisa_response_message,
        error_message=job.error_message,
    )
