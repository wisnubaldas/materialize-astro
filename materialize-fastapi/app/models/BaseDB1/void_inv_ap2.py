from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.mysql import BaseDB1


class VoidInvAp2(BaseDB1):
    __tablename__ = "void_inv_ap2"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    TANGGAL = Column(String(50))
    NO_INVOICE = Column(String(100))
    HAWB = Column(String(100))
    SMU = Column(String(100))
    RESPONSE = Column(Text)  # ✅ simpan JSON dict jadi string
    created_at = Column(DateTime, default=datetime.utcnow)  # DB-side default
