"""Schema untuk master data referensi CEISA lintas kategori."""

from datetime import datetime

from pydantic import BaseModel, Field


class CeisaReferenceCatalogItem(BaseModel):
    """Definisi kategori referensi CEISA yang didukung."""

    reference_slug: str
    reference_name: str


class MstCeisaReferenceCodeBase(BaseModel):
    """Field dasar master referensi CEISA."""

    reference_slug: str = Field(..., min_length=1, max_length=80)
    reference_name: str = Field(..., min_length=1, max_length=150)
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class MstCeisaReferenceCodeOut(MstCeisaReferenceCodeBase):
    """Response master referensi CEISA."""

    id: int
    last_synced_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CeisaReferenceCodeSyncResult(BaseModel):
    """Ringkasan hasil sinkronisasi referensi CEISA."""

    reference_slug: str
    inserted: int
    updated: int
    deactivated: int
    total_snapshot: int
    total_active: int


class CeisaReferenceCodeSyncEnqueueResult(BaseModel):
    """Response enqueue sinkronisasi referensi CEISA."""

    job_id: int
    reference_slug: str
    reference_name: str
    status: str
    message: str


class CeisaReferenceCodeSyncJobStatus(BaseModel):
    """Response detail status job sinkronisasi referensi CEISA."""

    job_id: int
    reference_slug: str
    reference_name: str
    status: str
    requested_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    inserted: int | None = None
    updated: int | None = None
    deactivated: int | None = None
    total_snapshot: int | None = None
    total_active: int | None = None
    error_message: str | None = None


class CeisaOAuthLoginProbeResult(BaseModel):
    """Response ringkas untuk uji login OAuth2 CEISA."""

    status: str
    message: str
    token_preview: str
    has_refresh_token: bool
