"""Service integrasi CEISA untuk kirim foto X-Ray barang kiriman."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.integrations.ceisa.client import CeisaClientService
from app.repositories.ceisa_xray_photo_repository import CeisaXrayPhotoRepository
from app.schemas.ceisa_xray_photo_schema import CeisaXrayPhotoRequestPayload
from app.utils.helper import BASE_DIR


@dataclass
class CeisaXraySavedFile:
    """Metadata file image yang sudah disimpan ke storage lokal."""

    original_filename: str
    stored_path: str
    content_type: str | None
    file_size: int | None


class CeisaXrayPhotoService:
    """Orkestrasi enqueue dan submit request kirim foto X-Ray CEISA."""

    def __init__(self, db: Session, client: CeisaClientService):
        """Inisialisasi service dengan session DB dan client CEISA."""
        self.db = db
        self.client = client
        self.repository = CeisaXrayPhotoRepository(db)
        self.storage_root = BASE_DIR / "storage" / "private" / "ceisa" / "xray"

    def enqueue_request(
        self,
        payload_json: str,
        images: list[UploadFile],
        operation_type: str = "KIRIM",
    ):
        """Simpan request kirim foto X-Ray ke queue dan storage lokal."""
        op_type = self._normalize_operation_type(operation_type)
        payload = self.parse_payload_json(payload_json)
        self._ensure_images(images)
        log = self.repository.create_queued(
            payload.model_dump(),
            operation_type=op_type,
        )

        saved_files = self._save_uploaded_images(int(log.id), images)
        for saved_file in saved_files:
            self.repository.add_image(
                request_id=int(log.id),
                original_filename=saved_file.original_filename,
                stored_path=saved_file.stored_path,
                content_type=saved_file.content_type,
                file_size=saved_file.file_size,
            )
        log = self.repository.set_images_count(log=log, images_count=len(saved_files))
        return log

    def get_job(self, job_id: int):
        """Ambil status job kirim foto X-Ray dari database."""
        return self.repository.ensure_exists(self.repository.get_by_id(job_id))

    def process_job(self, job_id: int) -> None:
        """Eksekusi kirim foto X-Ray ke CEISA berdasarkan id queue."""
        log = self.repository.ensure_exists(self.repository.get_by_id(job_id))
        images = self.repository.get_images(job_id)
        if not images:
            self.repository.mark_failed(log=log, error_message="File image tidak ditemukan")
            raise HTTPException(status_code=400, detail="File image tidak ditemukan")

        try:
            self.repository.mark_running(log)
            payload = self._load_payload_dict(log.request_payload)
            response_payload = self._send_to_ceisa(
                operation_type=str(log.operation_type or "KIRIM"),
                payload=payload,
                images=images,
            )
            self.repository.mark_success(log=log, response_payload=response_payload)
        except HTTPException as exc:
            self.repository.mark_failed(log=log, error_message=str(exc.detail))
            raise
        except Exception as exc:
            self.repository.mark_failed(log=log, error_message=str(exc))
            raise

    @staticmethod
    def parse_payload_json(payload_json: str) -> CeisaXrayPhotoRequestPayload:
        """Parse string JSON dari form-data part `data` menjadi schema."""
        try:
            payload_dict = json.loads(payload_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail="Part `data` harus JSON valid sesuai spesifikasi CEISA",
            ) from exc
        return CeisaXrayPhotoRequestPayload.model_validate(payload_dict)

    @staticmethod
    def _ensure_images(images: list[UploadFile]) -> None:
        """Validasi daftar image minimal 1 file dan bertipe image."""
        if not images:
            raise HTTPException(status_code=400, detail="Part `images` wajib diisi minimal 1 file")
        for image in images:
            content_type = str(image.content_type or "").lower().strip()
            if not content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"File `{image.filename}` bukan image valid",
                )

    def _save_uploaded_images(self, job_id: int, images: list[UploadFile]) -> list[CeisaXraySavedFile]:
        """Simpan file upload ke storage private agar bisa diproses background job."""
        batch_dir = self.storage_root / datetime.now(timezone.utc).strftime("%Y%m%d") / str(job_id)
        batch_dir.mkdir(parents=True, exist_ok=True)

        saved_files: list[CeisaXraySavedFile] = []
        for image in images:
            filename = image.filename or f"image-{uuid4().hex}.bin"
            safe_filename = f"{uuid4().hex}_{Path(filename).name}"
            destination = batch_dir / safe_filename
            image.file.seek(0)
            with destination.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            file_size = destination.stat().st_size
            saved_files.append(
                CeisaXraySavedFile(
                    original_filename=Path(filename).name,
                    stored_path=str(destination),
                    content_type=image.content_type,
                    file_size=int(file_size),
                )
            )
        return saved_files

    def _send_to_ceisa(self, operation_type: str, payload: dict[str, Any], images) -> Any:
        """Kirim multipart data + images ke endpoint kirim foto X-Ray CEISA."""
        endpoint_path = self._resolve_upload_endpoint(operation_type)
        multipart_files: list[tuple[str, Any]] = []
        opened_files = []
        try:
            multipart_files.append(
                (
                    "data",
                    (None, json.dumps(payload, ensure_ascii=False), "application/json"),
                )
            )
            for image in images:
                file_path = Path(image.stored_path)
                if not file_path.exists():
                    raise HTTPException(
                        status_code=400,
                        detail=f"File image tidak ditemukan: {file_path}",
                    )
                opened = file_path.open("rb")
                opened_files.append(opened)
                multipart_files.append(
                    (
                        "images",
                        (
                            image.original_filename,
                            opened,
                            image.content_type or "application/octet-stream",
                        ),
                    )
                )
            return self.client.request(
                method="POST",
                path=endpoint_path,
                files=multipart_files,
            )
        finally:
            for opened in opened_files:
                opened.close()

    @staticmethod
    def _load_payload_dict(raw_payload: str) -> dict[str, Any]:
        """Ubah payload string dari database menjadi dictionary."""
        try:
            parsed = json.loads(raw_payload)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=500,
                detail="Payload request X-Ray di database tidak valid",
            ) from exc
        if not isinstance(parsed, dict):
            raise HTTPException(status_code=500, detail="Payload request X-Ray harus object JSON")
        return parsed

    @staticmethod
    def _normalize_operation_type(operation_type: str) -> str:
        """Normalisasi dan validasi tipe operasi upload foto X-Ray."""
        normalized = str(operation_type or "KIRIM").upper().strip()
        if normalized not in {"KIRIM", "ADD"}:
            raise HTTPException(
                status_code=400,
                detail="Operation type upload X-Ray tidak valid",
            )
        return normalized

    @staticmethod
    def _resolve_upload_endpoint(operation_type: str) -> str:
        """Pilih endpoint CEISA sesuai tipe operasi upload foto X-Ray."""
        normalized = CeisaXrayPhotoService._normalize_operation_type(operation_type)
        if normalized == "ADD":
            return "/openapi/cnpibk/xray/add-foto-xray"
        return "/openapi/cnpibk/xray/kirim-foto-xray"

