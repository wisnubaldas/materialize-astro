"""Schema request/response untuk modul foto X-Ray CEISA."""

from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


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
    operation_type: str
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
    operation_type: str
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


class CeisaXrayPhotoGetRequestPayload(BaseModel):
    """Payload request get foto X-Ray CEISA."""

    nomorAju: str | None = Field(default=None, min_length=1, max_length=80)
    nomorBlAwb: str | None = Field(default=None, min_length=1, max_length=80)
    tanggalBlAwb: date | None = None
    kodeKantor: str | None = Field(default=None, min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_identifier(self):
        """Validasi pola identifikasi sesuai spesifikasi CEISA."""
        has_nomor_aju = bool((self.nomorAju or "").strip())
        has_triple = bool(
            (self.nomorBlAwb or "").strip()
            and self.tanggalBlAwb is not None
            and (self.kodeKantor or "").strip()
        )
        if not has_nomor_aju and not has_triple:
            raise ValueError(
                "Isi `nomorAju` atau kombinasi `nomorBlAwb`, `tanggalBlAwb`, `kodeKantor`"
            )
        return self


class CeisaXrayPhotoGetEnqueueResult(BaseModel):
    """Response enqueue request get foto X-Ray ke background job."""

    job_id: int
    status: str
    message: str
    nomor_aju: str | None = None
    nomor_bl_awb: str | None = None
    tanggal_bl_awb: date | None = None
    kode_kantor: str | None = None


class CeisaXrayPhotoGetJobStatus(BaseModel):
    """Response status proses get foto X-Ray CEISA."""

    job_id: int
    status: str
    nomor_aju: str | None = None
    nomor_bl_awb: str | None = None
    tanggal_bl_awb: date | None = None
    kode_kantor: str | None = None
    requested_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    ceisa_response_code: int | None = None
    ceisa_response_message: str | None = None
    error_message: str | None = None
