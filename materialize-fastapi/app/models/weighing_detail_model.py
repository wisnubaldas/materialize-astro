from sqlalchemy import DECIMAL, TIMESTAMP, Boolean, Column, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksWeighingDetail(BaseDB2):
    __tablename__ = "eks_weighingdetail"

    noid = Column(Integer, primary_key=True, autoincrement=True, index=True)

    ProofNumber = Column(String(18))
    MasterAWB = Column(String(15), nullable=False)
    HostAWB = Column(String(25))

    Pieces = Column(Integer)
    Pallet = Column(DECIMAL(10, 2))
    GrossWeight = Column(DECIMAL(10, 2))
    NettoWeight = Column(DECIMAL(10, 2))

    LongCargo = Column(Integer)
    WidthCargo = Column(Integer)
    HighCargo = Column(Integer)
    VolumeCargo = Column(DECIMAL(10, 2))

    CAW = Column(DECIMAL(10, 2))
    StorageRoom = Column(String(2))
    DG = Column(String(2))
    KindOfCode = Column(String(5))
    KindOfNature = Column(String(50))

    BuildUpFlag = Column(Boolean, default=False)
    DateEntry = Column(String(10))
    TimeEntry = Column(String(8))
    token = Column(String(5))

    created_at = Column(TIMESTAMP, server_default=func.now())
