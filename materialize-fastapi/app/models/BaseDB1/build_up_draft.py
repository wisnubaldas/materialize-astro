from sqlalchemy import JSON, TIMESTAMP, BigInteger, Column, Index
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpDraft(BaseDB1):
    """Draft manifest BuildUp sebelum disubmit menjadi build_up_header/detail."""

    __tablename__ = "build_up_draft"
    __table_args__ = (
        Index("ix_build_up_draft_create_at", "create_at"),
        Index("ix_build_up_draft_update_at", "update_at"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    rows = Column(JSON, nullable=False)
    payload = Column(JSON, nullable=True)
    ignored = Column(JSON, nullable=True)
    master_awbs = Column(JSON, nullable=True)
    create_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    update_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
