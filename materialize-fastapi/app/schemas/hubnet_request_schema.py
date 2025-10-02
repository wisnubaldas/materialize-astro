from datetime import datetime
from typing import Optional, Any, Dict, cast
from pydantic import BaseModel, Field, model_validator


class HubnetRequestSchemaBase(BaseModel):
    AWB_NO: str = Field(default=..., examples=["273-77889910"])
    FLT_NUMBER: Optional[str] = Field(default=None, examples=["OEY312"])
    FLT_DATE: Optional[datetime] = Field(default=None, examples=["2025-06-24"])
    ORI: Optional[str] = Field(default=None, examples=["CGK"])
    DEST: Optional[str] = Field(default=None, examples=["BWN"])
    FLT_NUMBER1: Optional[str] = Field(default=None, examples=["OEY312"])
    FLT_DATE1: Optional[datetime] = Field(default=None, examples=["2024-04-26 00:00:00"])
    ORI1: Optional[str] = Field(default=None, examples=["CGK"])
    T: Optional[str] = Field(default=None, examples=["30"])
    K: Optional[str] = Field(default=None, examples=["33.00"])
    CH_WEIGHT: Optional[str] = Field(default=None, examples=["45.00"])
    MC: Optional[str] = Field(default=None, examples=["5100.00"])
    AGT_NAME: Optional[str] = Field(default=None, examples=["PT Mitra Adira Utama"])
    AGT_ADD: Optional[str] = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    SHP_ADD: Optional[str] = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    SHP_NAME: Optional[str] = Field(default=None, examples=["PT Mitra Adira Utama"])
    CNE_NAME: Optional[str] = Field(default=None, examples=["PT Mitra Adira Utama"])
    CNE_ADD: Optional[str] = Field(
        default=None, examples=["Grand Slipi Tower 35th Floor Kav 22-24 Slipi 11480, Jakarta"]
    )
    KATEGORI_CARGO: Optional[str] = Field(default=None, examples=["DG"])
    COMMODITY: Optional[str] = Field(default=None, examples=["GENCO"])
    CARGO_TREATMENT: Optional[str] = Field(default=None, examples=["Baterai Treatment"])
    REMARKS: Optional[str] = Field(default=None, examples=["Baterai Nokia"])
    IS_INTERNATIONAL: Optional[str] = Field(default=None, examples=["0"])
    IS_EKSPOR: Optional[str] = Field(default=None, examples=["1"])

    class Config:
        from_attributes = True


class HubnetRequestGet(HubnetRequestSchemaBase):
    id: int
