"""Service orchestration untuk antrian dan eksekusi job sinkronisasi CEISA."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.integrations.ceisa.reference_catalog import CeisaReferenceCatalogService
from app.repository.ceisa_log_repository import CeisaLogRepository
from app.repository.ceisa_reference_code_repository import CeisaReferenceCodeRepository


class CeisaSyncJobService:
    """Service untuk enqueue dan process sinkronisasi referensi CEISA."""

    def __init__(self, db: Session, catalog_service: CeisaReferenceCatalogService):
        """Inisialisasi service dengan dependency repository dan catalog parser."""
        self.db = db
        self.catalog_service = catalog_service
        self.log_repository = CeisaLogRepository(db)
        self.reference_repository = CeisaReferenceCodeRepository(db)

    def enqueue_reference_sync(self, reference_slug: str):
        """Enqueue sinkronisasi referensi CEISA dan kembalikan log job."""
        catalog_item = self.catalog_service.get_catalog_item(reference_slug)
        return self.log_repository.create_queued(
            reference_slug=reference_slug,
            reference_name=catalog_item["reference_name"],
        )

    def get_job(self, job_id: int):
        """Ambil detail job berdasarkan id."""
        job = self.log_repository.get_by_id(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job sinkronisasi CEISA tidak ditemukan")
        return job

    def process_reference_sync_job(self, job_id: int) -> None:
        """Eksekusi job sinkronisasi referensi CEISA berdasarkan id log job."""
        job = self.log_repository.get_by_id(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job sinkronisasi CEISA tidak ditemukan")

        try:
            self.log_repository.mark_running(job)
            rows = self.catalog_service.fetch_reference_rows(job.reference_slug)
            inserted, updated, deactivated, total_active = self.reference_repository.sync_rows(
                reference_slug=job.reference_slug,
                reference_name=job.reference_name,
                rows=rows,
            )
            self.log_repository.mark_success(
                job=job,
                inserted=inserted,
                updated=updated,
                deactivated=deactivated,
                total_snapshot=len(rows),
                total_active=total_active,
            )
        except HTTPException as exc:
            self.log_repository.mark_failed(job, str(exc.detail))
            raise
        except Exception as exc:
            self.log_repository.mark_failed(job, str(exc))
            raise
