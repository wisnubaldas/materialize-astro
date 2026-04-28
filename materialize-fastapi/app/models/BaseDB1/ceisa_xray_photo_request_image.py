"""Model detail file image untuk request kirim foto X-Ray CEISA."""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class CeisaXrayPhotoRequestImage(BaseDB1):
    """Menyimpan metadata file image per request kirim foto X-Ray."""

    __tablename__ = "ceisa_xray_photo_request_image"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    xray_request_id = Column(
        BigInteger,
        ForeignKey("ceisa_xray_photo_request.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    content_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

