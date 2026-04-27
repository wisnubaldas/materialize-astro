"""Service layer untuk master data referensi CEISA lintas kategori."""

from fastapi import HTTPException

from app.repository.ceisa_reference_code_repository import CeisaReferenceCodeRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_code_schema import (
    CeisaReferenceCatalogItem,
    CeisaReferenceCodeSyncResult,
    MstCeisaReferenceCodeOut,
)
from app.services.ceisa.reference_catalog_service import CeisaReferenceCatalogService


class CeisaReferenceCodeService:
    """Service domain untuk operasi master referensi CEISA."""

    def __init__(
        self,
        repo: CeisaReferenceCodeRepository,
        catalog_service: CeisaReferenceCatalogService,
    ):
        """Inisialisasi service."""
        self.repository = repo
        self.catalog_service = catalog_service

    def list_catalog(self) -> list[CeisaReferenceCatalogItem]:
        """Daftar kategori referensi CEISA yang tersedia."""
        return [CeisaReferenceCatalogItem(**item) for item in self.catalog_service.list_catalog()]

    def list_by_reference_slug(self, reference_slug: str) -> list[MstCeisaReferenceCodeOut]:
        """Daftar master data berdasarkan kategori referensi."""
        self._ensure_supported_reference(reference_slug)
        records = self.repository.list_by_reference_slug(reference_slug)
        return [MstCeisaReferenceCodeOut.model_validate(item) for item in records]

    def datatable(
        self, reference_slug: str, params: DataTablesParams
    ) -> DataTablesResponse[MstCeisaReferenceCodeOut]:
        """Datatable master data berdasarkan kategori referensi."""
        self._ensure_supported_reference(reference_slug)
        if params.filters is None:
            raise HTTPException(status_code=400, detail="Filter datatable tidak valid")
        params.filters.reference_slug = reference_slug
        return self.repository.datatable(params)

    def sync_reference(self, reference_slug: str) -> CeisaReferenceCodeSyncResult:
        """Sinkronisasi snapshot kategori referensi dari dokumentasi CEISA."""
        catalog = self._ensure_supported_reference(reference_slug)
        rows = self.catalog_service.fetch_reference_rows(reference_slug)
        inserted, updated, deactivated, total_active = self.repository.sync_rows(
            reference_slug=reference_slug,
            reference_name=catalog["reference_name"],
            rows=rows,
        )
        return CeisaReferenceCodeSyncResult(
            reference_slug=reference_slug,
            inserted=inserted,
            updated=updated,
            deactivated=deactivated,
            total_snapshot=len(rows),
            total_active=total_active,
        )

    def _ensure_supported_reference(self, reference_slug: str) -> dict[str, str]:
        """Validasi kategori referensi harus termasuk daftar yang didukung."""
        return self.catalog_service.get_catalog_item(reference_slug)
