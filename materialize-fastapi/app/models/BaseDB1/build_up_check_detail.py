from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpCheckDetail(BaseDB1):
    """Detail checklist MAWB pada header build-up check."""

    __tablename__ = "build_up_check_detail"
    __table_args__ = (
        Index("ix_build_up_check_detail_header_id", "header_id"),
        Index("ix_build_up_check_detail_mawb", "mawb"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    header_id = Column(
        BigInteger,
        ForeignKey("build_up_check_header.id", ondelete="CASCADE"),
        nullable=False,
    )
    mawb = Column(String(100), nullable=True)
    total_pieces = Column(Integer, nullable=True)
    status = Column(Integer, nullable=False, server_default="0")
    agent = Column(String(100), nullable=True)
    remark = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    header = relationship("BuildUpCheckHeader", back_populates="details")
    rincian = relationship(
        "BuildUpCheckRincian",
        back_populates="check_detail",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
