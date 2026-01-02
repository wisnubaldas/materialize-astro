from sqlalchemy import DECIMAL, TIMESTAMP, BigInteger, Column, ForeignKey, Integer
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class ExpManifestSummary(BaseDB1):
    __tablename__ = "exp_manifest_summary"

    id = Column(BigInteger, primary_key=True)
    flight_id = Column(BigInteger, ForeignKey("exp_manifest_fligt.id"), nullable=False)

    total_pieces = Column(Integer)
    total_weight_kg = Column(DECIMAL(10, 2))

    created_at = Column(TIMESTAMP, server_default=func.now())
