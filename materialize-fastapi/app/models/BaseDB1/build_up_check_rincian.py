from sqlalchemy import TIMESTAMP, BigInteger, Column, Float, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpCheckRincian(BaseDB1):
    """Rincian pieces dan berat untuk satu detail build-up check."""

    __tablename__ = "build_up_check_rincian"
    __table_args__ = (Index("ix_build_up_check_rincian_check_detail_id", "check_detail_id"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    check_detail_id = Column(
        BigInteger,
        ForeignKey("build_up_check_detail.id", ondelete="CASCADE"),
        nullable=False,
    )
    pieces = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    check_detail = relationship("BuildUpCheckDetail", back_populates="rincian")
