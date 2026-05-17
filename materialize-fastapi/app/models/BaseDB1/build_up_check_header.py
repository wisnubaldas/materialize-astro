from sqlalchemy import TIMESTAMP, BigInteger, Column, Date, Index, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class BuildUpCheckHeader(BaseDB1):
    """Header checklist build-up ULD sebelum atau sesudah proses operasional."""

    __tablename__ = "build_up_check_header"
    __table_args__ = (
        Index("ix_build_up_check_header_uld", "uld"),
        Index("ix_build_up_check_header_flight_date", "flight_date"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    uld = Column(String(100), nullable=False)
    airlines = Column(String(50), nullable=True)
    dest = Column(String(50), nullable=True)
    flight_date = Column(Date, nullable=True)
    staff = Column(String(100), nullable=True)
    supervisor = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    details = relationship(
        "BuildUpCheckDetail",
        back_populates="header",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
