from sqlalchemy import BigInteger, Column, Integer, String, Text

from app.db.mysql import BaseDB1


class AP2FAILINV(BaseDB1):
    __tablename__ = "ap2_fail_inv"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    inv = Column(String(255), nullable=True)
    desc = Column(Text, nullable=True)
    status = Column(Integer, nullable=True, default=0)