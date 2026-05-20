from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
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
        Index("ix_build_up_check_detail_mawb_header", "mawb", "header_id"),
        Index("ix_build_up_check_detail_split_group", "split_group_key"),
        Index("ix_build_up_check_detail_allocation_final", "is_allocation_final"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    header_id = Column(
        BigInteger,
        ForeignKey("build_up_check_header.id", ondelete="CASCADE"),
        nullable=False,
    )
    mawb = Column(String(100), nullable=True)
    total_pieces = Column(Integer, nullable=True)
    master_total_pieces = Column(Integer, nullable=True)
    split_group_key = Column(String(150), nullable=True)
    split_sequence = Column(SmallInteger, nullable=True)
    split_total_uld = Column(SmallInteger, nullable=False, server_default="1")
    is_split_uld = Column(Boolean, nullable=False, server_default="0")
    is_allocation_final = Column(Boolean, nullable=False, server_default="0")
    allocation_closed_at = Column(TIMESTAMP, nullable=True)
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
