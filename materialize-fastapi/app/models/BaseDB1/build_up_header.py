from sqlalchemy import (
    Float,
    TIMESTAMP,
    BigInteger,
    Column,
    Date,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpHeader(BaseDB1):
    __tablename__ = "build_up_header"
    __table_args__ = (
        Index("ix_build_up_header_number_build_up", "number_build_up"),
        Index("ix_build_up_header_flight_date", "flight_date"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    number_build_up = Column(String(100), nullable=False)
    airlines_code = Column(String(50), nullable=True)
    origin = Column(String(50), nullable=True)
    dest = Column(String(50), nullable=True)
    flight_date = Column(Date, nullable=True)
    for_official_use = Column(String(255), nullable=True)
    total_pieces = Column(Integer, nullable=True)
    total_weight = Column(Float, nullable=True)
    total_volume = Column(Float, nullable=True)
    pdf_link = Column(String(255), nullable=True)
    create_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    update_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    details = relationship(
        "BuildUpDetail",
        back_populates="header",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
