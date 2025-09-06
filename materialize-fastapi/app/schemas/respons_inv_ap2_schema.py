# app/schemas/respons_inv_ap2_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ResponsInvAp2Base(BaseModel):
    inv: Optional[str] = None
    response: Optional[str] = None
    status: Optional[str] = None


class ResponsInvAp2Create(ResponsInvAp2Base):
    pass


class ResponsInvAp2Get(ResponsInvAp2Base):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True