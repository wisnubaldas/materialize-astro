"""Repository untuk log background job sinkronisasi CEISA."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.BaseDB1.ceisa_reference_sync_log import CeisaReferenceSyncLog
from app.models.BaseDB1.ceisa_request_log import CeisaRequestLog
from app.models.BaseDB1.ceisa_webhook_log import CeisaWebhookLog


@dataclass(slots=True)
class CeisaSyncSuccessMetrics:
    inserted: int
    updated: int
    deactivated: int
    total_snapshot: int
    total_active: int


@dataclass(slots=True)
class CeisaRequestLogInput:
    service_name: str
    endpoint_path: str
    http_method: str
    request_headers: dict[str, Any] | None
    request_payload: Any
    request_id: str | None = None


@dataclass(slots=True)
class CeisaWebhookLogInput:
    webhook_event_id: str | None
    event_type: str | None
    request_headers: dict[str, Any] | None
    request_payload: Any
    signature_value: str | None = None
    signature_valid: bool | None = None


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
        metrics: CeisaSyncSuccessMetrics,
    ) -> CeisaReferenceSyncLog:
        """Update status log menjadi SUCCESS beserta metrik sinkronisasi."""
        log.status = "SUCCESS"
        log.finished_at = datetime.now(timezone.utc)
        log.inserted_count = metrics.inserted
        log.updated_count = metrics.updated
        log.deactivated_count = metrics.deactivated
        log.total_snapshot = metrics.total_snapshot
        log.total_active = metrics.total_active
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

    def create_request_log(self, payload: CeisaRequestLogInput) -> CeisaRequestLog:
        """Buat log awal untuk request outbound CEISA."""
        log = CeisaRequestLog(
            request_id=payload.request_id,
            service_name=payload.service_name,
            endpoint_path=payload.endpoint_path,
            http_method=payload.http_method.upper(),
            request_headers=self._to_text(payload.request_headers),
            request_payload=self._to_text(payload.request_payload),
            request_at=datetime.now(timezone.utc),
            execution_status="PENDING",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_request_success(
        self,
        log: CeisaRequestLog,
        response_status_code: int,
        response_headers: dict[str, Any] | None,
        response_payload: Any,
    ) -> CeisaRequestLog:
        """Tandai log outbound CEISA sebagai sukses."""
        log.response_status_code = response_status_code
        log.response_headers = self._to_text(response_headers)
        log.response_payload = self._to_text(response_payload)
        log.response_at = datetime.now(timezone.utc)
        log.execution_status = "SUCCESS"
        log.error_message = None
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_request_failed(
        self,
        log: CeisaRequestLog,
        error_message: str,
        response_status_code: int | None = None,
        response_headers: dict[str, Any] | None = None,
        response_payload: Any = None,
    ) -> CeisaRequestLog:
        """Tandai log outbound CEISA sebagai gagal."""
        log.response_status_code = response_status_code
        log.response_headers = self._to_text(response_headers)
        log.response_payload = self._to_text(response_payload)
        log.response_at = datetime.now(timezone.utc)
        log.execution_status = "FAILED"
        log.error_message = error_message[:500]
        log.retry_count = int(log.retry_count or 0) + 1
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    def create_webhook_log(self, payload: CeisaWebhookLogInput) -> CeisaWebhookLog:
        """Buat log awal webhook inbound CEISA."""
        log = CeisaWebhookLog(
            webhook_event_id=payload.webhook_event_id,
            event_type=payload.event_type,
            request_headers=self._to_text(payload.request_headers),
            request_payload=self._to_text(payload.request_payload),
            signature_value=payload.signature_value,
            signature_valid=payload.signature_valid,
            processing_status="RECEIVED",
            received_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    @staticmethod
    def _to_text(payload: Any) -> str | None:
        """Serialisasi payload apapun ke string untuk kebutuhan audit log."""
        if payload is None:
            return None
        if isinstance(payload, str):
            return payload
        try:
            return json.dumps(payload, ensure_ascii=False, default=str)
        except Exception:
            return str(payload)
