"""Schema untuk master data referensi CEISA lintas kategori."""

from datetime import datetime

from pydantic import BaseModel, Field


class CeisaReferenceCatalogItem(BaseModel):
    """Definisi kategori referensi CEISA yang didukung."""

    reference_slug: str
    reference_name: str
    doc_url: str


class MstCeisaReferenceCodeBase(BaseModel):
    """Field dasar master referensi CEISA."""

    reference_slug: str = Field(..., min_length=1, max_length=80)
    reference_name: str = Field(..., min_length=1, max_length=150)
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=500)
    doc_url: str | None = Field(default=None, max_length=255)
    source: str = Field(default="CEISA_GITBOOK", min_length=1, max_length=30)
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
