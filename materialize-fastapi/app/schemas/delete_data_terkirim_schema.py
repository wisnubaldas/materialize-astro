from pydantic import BaseModel, Field


class DeleteDataTerkirimSchema(BaseModel):
    AWB_NO: str = Field(default=..., examples=["023-54867864"])
    FLT_NUMBER: str = Field(default=..., examples=["FX6068"])
    FLT_DATE: str = Field(default=..., examples=["2024-12-10 00:00:00"])
