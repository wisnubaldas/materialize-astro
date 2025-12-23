from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Column, Date, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class ExpManifestFligt(BaseDB1):
    __tablename__ = "exp_manifest_fligt"

    id = Column(BigInteger, primary_key=True)

    airline_code = Column(String(5), nullable=False)
    flight_number = Column(String(10), nullable=False)
    flight_date = Column(Date, nullable=False)

    aircraft_registration = Column(String(20))

    point_of_loading = Column(String(3), nullable=False)
    point_of_unloading = Column(String(3), nullable=False)

    total_pieces = Column(BigInteger, default=0)
    total_weight_kg = Column(DECIMAL(10, 2), default=0)

    source_document = Column(String(50), default="FEDEX_MANIFEST")
    raw_text = Column(Text)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    ulds = relationship("ExpManifestUld", back_populates="flight", cascade="all, delete-orphan")
