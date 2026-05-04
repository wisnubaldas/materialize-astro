from pydantic import BaseModel, ConfigDict


class TpsOnlineImpInOut(BaseModel):
    """Dynamic row schema for TPS Online `get_imp_in` query result."""

    model_config = ConfigDict(extra="allow")

    no_bl_awb: str | None = None
