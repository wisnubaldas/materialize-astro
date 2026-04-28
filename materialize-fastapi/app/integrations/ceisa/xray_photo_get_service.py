"""Service integrasi CEISA untuk get foto X-Ray barang kiriman."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.integrations.ceisa.client import CeisaClientService
from app.repository.ceisa_xray_photo_get_repository import CeisaXrayPhotoGetRepository
from app.schemas.ceisa_xray_photo_schema import CeisaXrayPhotoGetRequestPayload


class CeisaXrayPhotoGetService:
    """Orkestrasi enqueue dan proses get foto X-Ray CEISA."""

    def __init__(self, db: Session, client: CeisaClientService):
        """Inisialisasi service dengan session DB dan client CEISA."""
        self.db = db
        self.client = client
        self.repository = CeisaXrayPhotoGetRepository(db)

    def enqueue_request(self, payload: CeisaXrayPhotoGetRequestPayload):
        """Simpan request get foto X-Ray ke queue."""
        return self.repository.create_queued(payload.model_dump())

    def get_job(self, job_id: int):
        """Ambil status job get foto X-Ray."""
        return self.repository.ensure_exists(self.repository.get_by_id(job_id))

    def process_job(self, job_id: int) -> None:
        """Eksekusi request get foto X-Ray ke CEISA berdasarkan id queue."""
        log = self.repository.ensure_exists(self.repository.get_by_id(job_id))
        try:
            self.repository.mark_running(log)
            params = self._build_query_params(log)
            response_payload = self.client.get(
                path="/openapi/cnpibk/xray/get-foto-xray",
                params=params,
            )
            self.repository.mark_success(log=log, response_payload=response_payload)
        except HTTPException as exc:
            self.repository.mark_failed(log=log, error_message=str(exc.detail))
            raise
        except Exception as exc:
            self.repository.mark_failed(log=log, error_message=str(exc))
            raise

    @staticmethod
    def _build_query_params(log) -> dict[str, Any]:
        """Bangun query parameter get foto X-Ray sesuai data request."""
        params: dict[str, Any] = {}
        if log.nomor_aju:
            params["nomorAju"] = log.nomor_aju
        if log.nomor_bl_awb:
            params["nomorBlAwb"] = log.nomor_bl_awb
        if log.tanggal_bl_awb is not None:
            params["tanggalBlAwb"] = log.tanggal_bl_awb.isoformat()
        if log.kode_kantor:
            params["kodeKantor"] = log.kode_kantor
        if not params:
            raise HTTPException(
                status_code=400,
                detail="Parameter request get foto X-Ray tidak valid",
            )
        return params

