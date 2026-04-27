"""Schema untuk master data referensi asal barang CEISA."""

from datetime import datetime

from pydantic import BaseModel, Field


class MstCeisaReferenceOriginGoodsBase(BaseModel):
    """Field dasar master referensi asal barang."""

    code: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=500)
    source: str = Field(default="CEISA", min_length=1, max_length=30)
    is_active: bool = True


class MstCeisaReferenceOriginGoodsCreate(MstCeisaReferenceOriginGoodsBase):
    """Payload untuk membuat data referensi asal barang."""


class MstCeisaReferenceOriginGoodsUpdate(BaseModel):
    """Payload untuk mengubah data referensi asal barang."""

    code: str | None = Field(default=None, min_length=1, max_length=10)
    name: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, min_length=1, max_length=30)
    is_active: bool | None = None


class MstCeisaReferenceOriginGoodsOut(MstCeisaReferenceOriginGoodsBase):
    """Response data referensi asal barang."""

    id: int
    last_synced_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CeisaReferenceOriginGoodsSyncResult(BaseModel):
    """Ringkasan hasil sinkronisasi data referensi asal barang."""

    inserted: int
    updated: int
    total: int
