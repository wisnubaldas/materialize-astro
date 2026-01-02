from sqlalchemy import TIMESTAMP, BigInteger, Column, ForeignKey, Index, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class ExpManifestUld(BaseDB1):
    __tablename__ = "exp_manifest_uld"
    __table_args__ = (Index("uk_uld", "flight_id", "uld_type", "uld_number"),)

    id = Column(BigInteger, primary_key=True)
    flight_id = Column(BigInteger, ForeignKey("exp_manifest_fligt.id"))

    uld_type = Column(String(5), nullable=False)
    uld_number = Column(String(20), nullable=False)
    uld_owner = Column(String(5), default="FX")

    destination = Column(String(3), nullable=False)
    remarks = Column(String(255))

    created_at = Column(TIMESTAMP, server_default=func.now())

    flight = relationship("ExpManifestFligt", back_populates="ulds")
    mawbs = relationship("ExpManifestMawb", back_populates="uld", cascade="all, delete-orphan")
