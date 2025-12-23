# app/models/respons_inv_ap2_model.py
from sqlalchemy import TIMESTAMP, BigInteger, Column, String, Text, func

from app.db.mysql import BaseDB1


class ResponsInvAp2(BaseDB1):
    __tablename__ = "respons_inv_ap2"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    inv = Column(String(255), nullable=True)
    response = Column(Text, nullable=True)
    status = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
