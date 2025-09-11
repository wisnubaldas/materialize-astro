# app/schemas/respons_inv_ap2_schema.py
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import json


class ResponsInvAp2Base(BaseModel):
    inv: Optional[str] = None
    response: Optional[dict] = None
    status: Optional[str] = None
    class Config:
        from_attributes = True 
    
    @field_validator("response",mode="before")
    @classmethod
    def parse_response(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v.strip())
            except Exception:
                return {}
        return v
    
class ResponsInvAp2Create(ResponsInvAp2Base):
    pass


class ResponsInvAp2Get(ResponsInvAp2Base):
    id: int
    created_at: datetime
    updated_at: datetime