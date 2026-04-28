"""Model log webhook inbound dari CEISA."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class CeisaWebhookLog(BaseDB1):
    """Mencatat payload webhook CEISA, status verifikasi, dan hasil proses."""

    __tablename__ = "ceisa_webhook_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    webhook_event_id = Column(String(100), nullable=True, index=True)
    event_type = Column(String(100), nullable=True, index=True)
    source = Column(String(100), nullable=False, server_default="CEISA")
    request_headers = Column(Text, nullable=True)
    request_payload = Column(Text, nullable=True)
    signature_value = Column(String(255), nullable=True)
    signature_valid = Column(Boolean, nullable=True)
    received_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    processing_status = Column(String(30), nullable=False, server_default="RECEIVED", index=True)
    processed_at = Column(DateTime, nullable=True)
    response_status_code = Column(Integer, nullable=True)
    response_payload = Column(Text, nullable=True)
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)
