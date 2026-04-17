from sqlalchemy import TIMESTAMP, BigInteger, Column, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpDeadStock(BaseDB1):
    __tablename__ = "build_up_dead_stock"
    __table_args__ = (
        Index("ix_build_up_dead_stock_build_up_detail_id", "build_up_detail_id"),
        Index("ix_build_up_dead_stock_mawb", "mawb"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    build_up_detail_id = Column(
        BigInteger,
        ForeignKey("build_up_detail.id", ondelete="SET NULL"),
        nullable=True,
    )
    mawb = Column(String(100), nullable=False)
    pieces = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    create_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    update_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    build_up_detail = relationship("BuildUpDetail", back_populates="dead_stocks")
