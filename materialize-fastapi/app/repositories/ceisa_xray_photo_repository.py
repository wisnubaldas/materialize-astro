"""Repository untuk request kirim foto X-Ray CEISA."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.BaseDB1.ceisa_xray_photo_request import CeisaXrayPhotoRequest
from app.models.BaseDB1.ceisa_xray_photo_request_image import CeisaXrayPhotoRequestImage


class CeisaXrayPhotoRepository:
    """Akses data queue request kirim foto X-Ray CEISA."""

    def __init__(self, db: Session):
        """Inisialisasi repository dengan SQLAlchemy session."""
        self.db = db

    def create_queued(
        self,
        payload: dict[str, Any],
        operation_type: str = "KIRIM",
    ) -> CeisaXrayPhotoRequest:
        """Buat queue request kirim foto X-Ray dengan status QUEUED."""
        op_type = str(operation_type or "KIRIM").upper()
        log = CeisaXrayPhotoRequest(
            nomor_aju=str(payload["nomorAju"]).strip(),
            nomor_bl_awb=str(payload["nomorBlAwb"]).strip(),
            tanggal_bl_awb=payload["tanggalBlAwb"],
            kode_kantor=str(payload["kodeKantor"]).strip(),
            operation_type=op_type,
            images_count=0,
            request_payload=self._to_text(payload) or "{}",
            status="QUEUED",
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def add_image(
        self,
        request_id: int,
        original_filename: str,
        stored_path: str,
        content_type: str | None,
        file_size: int | None,
    ) -> CeisaXrayPhotoRequestImage:
        """Simpan metadata file image yang diupload."""
        image = CeisaXrayPhotoRequestImage(
            xray_request_id=request_id,
            original_filename=original_filename,
            stored_path=stored_path,
            content_type=content_type,
            file_size=file_size,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def set_images_count(self, log: CeisaXrayPhotoRequest, images_count: int) -> CeisaXrayPhotoRequest:
        """Perbarui total image pada queue request."""
        log.images_count = max(0, int(images_count))
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, request_id: int) -> CeisaXrayPhotoRequest | None:
        """Ambil queue request berdasarkan id."""
        return (
            self.db.query(CeisaXrayPhotoRequest)
            .filter(CeisaXrayPhotoRequest.id == request_id)
            .first()
        )

    def get_images(self, request_id: int) -> list[CeisaXrayPhotoRequestImage]:
        """Ambil daftar metadata image berdasarkan id request."""
        return (
            self.db.query(CeisaXrayPhotoRequestImage)
            .filter(CeisaXrayPhotoRequestImage.xray_request_id == request_id)
            .order_by(CeisaXrayPhotoRequestImage.id.asc())
            .all()
        )

    def mark_running(self, log: CeisaXrayPhotoRequest) -> CeisaXrayPhotoRequest:
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
        log: CeisaXrayPhotoRequest,
        response_payload: Any,
    ) -> CeisaXrayPhotoRequest:
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

    def mark_failed(self, log: CeisaXrayPhotoRequest, error_message: str) -> CeisaXrayPhotoRequest:
        """Tandai request sebagai FAILED."""
        log.status = "FAILED"
        log.finished_at = datetime.now(timezone.utc)
        log.error_message = (error_message or "")[:500]
        log.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(log)
        return log

    @staticmethod
    def ensure_exists(log: CeisaXrayPhotoRequest | None) -> CeisaXrayPhotoRequest:
        """Validasi entity request harus ditemukan."""
        if log is None:
            raise HTTPException(status_code=404, detail="Request kirim foto X-Ray CEISA tidak ditemukan")
        return log

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
