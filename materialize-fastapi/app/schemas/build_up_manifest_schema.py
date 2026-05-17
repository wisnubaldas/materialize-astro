from typing import Any

from pydantic import BaseModel, Field, field_validator


class BuildUpManifestSubmitRequest(BaseModel):
    """Payload submit manifest Build Up berbasis JSON untuk mobile/API client."""

    flight_manifest: list[dict[str, Any]] = Field(default_factory=list)
    uld: list[dict[str, Any]] = Field(default_factory=list)
    mawb: list[dict[str, Any]] = Field(default_factory=list)

    @field_validator("flight_manifest", "uld", "mawb")
    @classmethod
    def validate_rows(cls, value: list[dict[str, Any]], info) -> list[dict[str, Any]]:
        """Pastikan setiap section manifest memiliki minimal satu baris."""
        if not value:
            raise ValueError(f"{info.field_name} wajib memiliki minimal satu baris")
        return value


class BuildUpManifestSubmitOut(BaseModel):
    """Response submit manifest Build Up."""

    message: str
    header_count: int
    detail_count: int
    pdf_url: str
    pdf_filename: str
