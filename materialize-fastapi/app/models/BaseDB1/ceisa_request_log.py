"""Model log request/response integrasi API CEISA."""

from sqlalchemy import BigInteger, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class CeisaRequestLog(BaseDB1):
    """Mencatat request dan response outbound dari sistem ke CEISA."""

    __tablename__ = "ceisa_request_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id = Column(String(100), nullable=True, index=True)
    service_name = Column(String(100), nullable=False, index=True)
    endpoint_path = Column(String(255), nullable=False)
    http_method = Column(String(10), nullable=False)
    request_headers = Column(Text, nullable=True)
    request_payload = Column(Text, nullable=True)
    request_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    response_status_code = Column(Integer, nullable=True)
    response_headers = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    response_at = Column(DateTime, nullable=True)
    execution_status = Column(String(30), nullable=False, server_default="PENDING", index=True)
    error_message = Column(String(500), nullable=True)
    retry_count = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True)
