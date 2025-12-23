from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Boolean, Column, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class ExpManifestMawb(BaseDB1):
    __tablename__ = "exp_manifest_mawb"

    id = Column(BigInteger, primary_key=True)
    uld_id = Column(BigInteger, ForeignKey("exp_manifest_uld.id"))

    mawb_prefix = Column(String(3), nullable=False)
    mawb_number = Column(String(20), nullable=False)

    pieces = Column(BigInteger, nullable=False)
    weight_kg = Column(DECIMAL(10, 2), nullable=False)

    nature_of_goods = Column(String(100))
    route = Column(String(50))
    transit_flag = Column(Boolean, default=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

    uld = relationship("ExpManifestUld", back_populates="mawbs")
