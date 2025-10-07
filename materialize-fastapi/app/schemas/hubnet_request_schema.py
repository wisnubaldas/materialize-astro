from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class HubnetRequestBase(BaseModel):
    AWB_NO: str = Field(default=..., examples=["273-77889910"])
    FLT_NUMBER: str | None = Field(default=None, examples=["OEY312"])
    FLT_DATE: datetime | None = Field(default=None, examples=["2025-06-24"])
    ORI: str | None = Field(default=None, examples=["CGK"])
    DEST: str | None = Field(default=None, examples=["BWN"])
    FLT_NUMBER1: str | None = Field(default=None, examples=["OEY312"])
    FLT_DATE1: datetime | None = Field(default=None, examples=["2024-04-26 00:00:00"])
    ORI1: str | None = Field(default=None, examples=["CGK"])
    T: str | None = Field(default=None, examples=["30"])
    K: str | None = Field(default=None, examples=["33.00"])
    CH_WEIGHT: str | None = Field(default=None, examples=["45.00"])
    MC: str | None = Field(default=None, examples=["5100.00"])
    AGT_NAME: str | None = Field(default=None, examples=["PT Mitra Adira Utama"])
    AGT_ADD: str | None = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    SHP_ADD: str | None = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    SHP_NAME: str | None = Field(default=None, examples=["PT Mitra Adira Utama"])
    CNE_NAME: str | None = Field(default=None, examples=["PT Mitra Adira Utama"])
    CNE_ADD: str | None = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    KATEGORI_CARGO: str | None = Field(default=None, examples=["DG"])
    COMMODITY: str | None = Field(default=None, examples=["GENCO"])
    CARGO_TREATMENT: str | None = Field(default=None, examples=["Baterai Treatment"])
    REMARKS: str | None = Field(default=None, examples=["Baterai Nokia"])
    IS_INTERNATIONAL: str | None = Field(default=None, examples=["0"])
    IS_EKSPOR: str | None = Field(default=None, examples=["1"])

    model_config = {"from_attributes": True, "extra": "ignore"}


class HubnetRequestGet(HubnetRequestBase):
    id: int


class HubnetRequestCreate(HubnetRequestBase):
    """Schema untuk insert data baru dengan validasi unik AWB_NO."""

    @model_validator(mode="after")
    def check_unique_awb(cls, values):
        """
        Validasi tambahan agar AWB_NO tidak duplikat.
        Pengecekan dilakukan secara manual oleh service.
        """
        # Catatan: ini hanya placeholder agar developer tahu harus validasi di service.
        # Pydantic tidak bisa query DB langsung, jadi validasi real dilakukan di service layer.
        if not values.AWB_NO or not isinstance(values.AWB_NO, str):
            raise ValueError("AWB_NO harus berupa string dan wajib diisi.")
        return values
