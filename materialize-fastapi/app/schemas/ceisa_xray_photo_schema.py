"""Schema request/response untuk modul kirim foto X-Ray CEISA."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class CeisaXrayPhotoRequestPayload(BaseModel):
    """Payload JSON pada part `data` multipart kirim foto X-Ray CEISA."""

    nomorAju: str = Field(..., min_length=1, max_length=80)
    nomorBlAwb: str = Field(..., min_length=1, max_length=80)
    tanggalBlAwb: date
    kodeKantor: str = Field(..., min_length=1, max_length=20)


class CeisaXrayPhotoEnqueueResult(BaseModel):
    """Response enqueue request kirim foto X-Ray ke background job."""

    job_id: int
    status: str
    message: str
    nomor_aju: str
    nomor_bl_awb: str
    tanggal_bl_awb: date
    kode_kantor: str
    images_count: int


class CeisaXrayPhotoJobStatus(BaseModel):
    """Response status proses kirim foto X-Ray CEISA."""

    job_id: int
    status: str
    nomor_aju: str
    nomor_bl_awb: str
    tanggal_bl_awb: date
    kode_kantor: str
    images_count: int
    requested_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    ceisa_response_code: int | None = None
    ceisa_response_message: str | None = None
    error_message: str | None = None

