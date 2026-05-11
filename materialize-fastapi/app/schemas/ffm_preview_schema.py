from pydantic import BaseModel, ConfigDict, Field


class FfmPreviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    header_id: int
    buildup_number: str | None = None
    generated: bool
    cargo_imp: str | None = None
    cargo_xml: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
