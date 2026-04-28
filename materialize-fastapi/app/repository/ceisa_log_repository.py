"""Repository untuk log background job sinkronisasi CEISA."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.BaseDB1.ceisa_reference_sync_log import CeisaReferenceSyncLog


class CeisaLogRepository:
    """Akses data log sinkronisasi CEISA di DB1."""

    def __init__(self, db: Session):
        """Inisialisasi repository dengan SQLAlchemy session."""
        self.db = db

    def create_queued(self, reference_slug: str, reference_name: str) -> CeisaReferenceSyncLog:
        """Buat log baru dengan status QUEUED."""
        log = CeisaReferenceSyncLog(
            reference_slug=reference_slug,
            reference_name=reference_name,
            status="QUEUED",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, log_id: int) -> CeisaReferenceSyncLog | None:
        """Ambil log berdasarkan id."""
        return self.db.query(CeisaReferenceSyncLog).filter(CeisaReferenceSyncLog.id == log_id).first()

    def mark_running(self, log: CeisaReferenceSyncLog) -> CeisaReferenceSyncLog:
        """Update status log menjadi RUNNING."""
        log.status = "RUNNING"
        log.started_at = datetime.now(timezone.utc)
        log.finished_at = None
        log.error_message = None
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_success(
        self,
        log: CeisaReferenceSyncLog,
        inserted: int,
        updated: int,
        deactivated: int,
        total_snapshot: int,
        total_active: int,
    ) -> CeisaReferenceSyncLog:
        """Update status log menjadi SUCCESS beserta metrik sinkronisasi."""
        log.status = "SUCCESS"
        log.finished_at = datetime.now(timezone.utc)
        log.inserted_count = inserted
        log.updated_count = updated
        log.deactivated_count = deactivated
        log.total_snapshot = total_snapshot
        log.total_active = total_active
        log.error_message = None
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_failed(self, log: CeisaReferenceSyncLog, error_message: str) -> CeisaReferenceSyncLog:
        """Update status log menjadi FAILED dengan detail error."""
        log.status = "FAILED"
        log.finished_at = datetime.now(timezone.utc)
        log.error_message = error_message[:500]
        self.db.commit()
        self.db.refresh(log)
        return log
