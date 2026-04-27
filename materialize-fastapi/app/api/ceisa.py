"""API endpoint untuk master data CEISA."""

from fastapi import APIRouter, Depends

from app.dependencies.ceisa_reference_code_deps import (
    get_ceisa_reference_code_service_r,
    get_ceisa_reference_code_service_w,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_code_schema import (
    CeisaReferenceCatalogItem,
    CeisaReferenceCodeSyncResult,
    MstCeisaReferenceCodeOut,
)
from app.services.ceisa_reference_code_service import CeisaReferenceCodeService

router = APIRouter(prefix="/ceisa", tags=["CEISA Master Data"])


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
    summary="Sinkronisasi master referensi CEISA dari GitBook",
    response_model=CeisaReferenceCodeSyncResult,
)
def sync_reference_codes(
    reference_slug: str,
    service: CeisaReferenceCodeService = Depends(get_ceisa_reference_code_service_w),
):
    """Sinkronisasi snapshot kategori referensi CEISA."""
    return service.sync_reference(reference_slug)
