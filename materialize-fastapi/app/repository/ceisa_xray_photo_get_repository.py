"""Repository untuk request get foto X-Ray CEISA."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.BaseDB1.ceisa_xray_photo_get_request import CeisaXrayPhotoGetRequest


class CeisaXrayPhotoGetRepository:
    """Akses data queue request get foto X-Ray CEISA."""

    def __init__(self, db: Session):
        """Inisialisasi repository dengan SQLAlchemy session."""
        self.db = db

    def create_queued(self, payload: dict[str, Any]) -> CeisaXrayPhotoGetRequest:
        """Buat queue request get foto X-Ray dengan status QUEUED."""
        log = CeisaXrayPhotoGetRequest(
            nomor_aju=self._normalize_nullable(payload.get("nomorAju")),
            nomor_bl_awb=self._normalize_nullable(payload.get("nomorBlAwb")),
            tanggal_bl_awb=payload.get("tanggalBlAwb"),
            kode_kantor=self._normalize_nullable(payload.get("kodeKantor")),
            status="QUEUED",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, request_id: int) -> CeisaXrayPhotoGetRequest | None:
        """Ambil queue request berdasarkan id."""
        return (
            self.db.query(CeisaXrayPhotoGetRequest)
            .filter(CeisaXrayPhotoGetRequest.id == request_id)
            .first()
        )

    def mark_running(self, log: CeisaXrayPhotoGetRequest) -> CeisaXrayPhotoGetRequest:
        """Ubah status menjadi RUNNING saat job mulai diproses."""
        log.status = "RUNNING"
        log.started_at = datetime.now(timezone.utc)
        log.finished_at = None
        log.error_message = None
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_success(
        self,
        log: CeisaXrayPhotoGetRequest,
        response_payload: Any,
    ) -> CeisaXrayPhotoGetRequest:
        """Tandai request sebagai SUCCESS beserta payload response CEISA."""
        response_code, response_message = self._extract_response_summary(response_payload)
        log.status = "SUCCESS"
        log.finished_at = datetime.now(timezone.utc)
        log.ceisa_response_code = response_code
        log.ceisa_response_message = response_message
        log.ceisa_response_payload = self._to_text(response_payload)
        log.error_message = None
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    def mark_failed(self, log: CeisaXrayPhotoGetRequest, error_message: str) -> CeisaXrayPhotoGetRequest:
        """Tandai request sebagai FAILED."""
        log.status = "FAILED"
        log.finished_at = datetime.now(timezone.utc)
        log.error_message = (error_message or "")[:500]
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    @staticmethod
    def ensure_exists(log: CeisaXrayPhotoGetRequest | None) -> CeisaXrayPhotoGetRequest:
        """Validasi entity request harus ditemukan."""
        if log is None:
            raise HTTPException(status_code=404, detail="Request get foto X-Ray CEISA tidak ditemukan")
        return log

    @staticmethod
    def _normalize_nullable(value: Any) -> str | None:
        """Normalisasi field string nullable."""
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @staticmethod
    def _extract_response_summary(response_payload: Any) -> tuple[int | None, str | None]:
        """Ekstrak ringkasan code/message dari response CEISA."""
        if not isinstance(response_payload, dict):
            return None, None
        code_value = response_payload.get("code")
        message_value = response_payload.get("message")
        try:
            code = int(code_value) if code_value is not None else None
        except (TypeError, ValueError):
            code = None
        message = str(message_value).strip() if message_value is not None else None
        return code, message

    @staticmethod
    def _to_text(payload: Any) -> str | None:
        """Serialisasi payload object ke string JSON."""
        if payload is None:
            return None
        if isinstance(payload, str):
            return payload
        try:
            return json.dumps(payload, ensure_ascii=False, default=str)
        except Exception:
            return str(payload)

