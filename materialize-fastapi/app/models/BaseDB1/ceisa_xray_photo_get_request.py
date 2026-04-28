"""Model transaksi request get foto X-Ray dari CEISA."""

from sqlalchemy import BigInteger, Column, Date, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class CeisaXrayPhotoGetRequest(BaseDB1):
    """Log antrian request tarik data foto X-Ray CEISA."""

    __tablename__ = "ceisa_xray_photo_get_request"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nomor_aju = Column(String(80), nullable=True, index=True)
    nomor_bl_awb = Column(String(80), nullable=True, index=True)
    tanggal_bl_awb = Column(Date, nullable=True, index=True)
    kode_kantor = Column(String(20), nullable=True, index=True)
    status = Column(String(30), nullable=False, server_default="QUEUED", index=True)
    requested_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    ceisa_response_code = Column(Integer, nullable=True)
    ceisa_response_message = Column(String(500), nullable=True)
    ceisa_response_payload = Column(Text, nullable=True)
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)

