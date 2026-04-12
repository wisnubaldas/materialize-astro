from sqlalchemy import (
    Float,
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


class BuildUpDetail(BaseDB1):
    __tablename__ = "build_up_detail"
    __table_args__ = (
        Index("ix_build_up_detail_header_id", "header_id"),
        Index("ix_build_up_detail_mawb", "mawb"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    header_id = Column(
        BigInteger,
        ForeignKey("build_up_header.id", ondelete="CASCADE"),
        nullable=False,
    )
    mawb = Column(String(100), nullable=True)
    uld_number = Column(String(50), nullable=True)
    uld_type = Column(String(50), nullable=True)
    pieces = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    nature_of_goods = Column(Text, nullable=True)
    remark = Column(Text, nullable=True)
    create_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    header = relationship("BuildUpHeader", back_populates="details")
