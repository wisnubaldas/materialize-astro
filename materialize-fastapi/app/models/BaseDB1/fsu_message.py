from sqlalchemy import Boolean, Column, Integer, String, Text

from app.db.mysql import BaseDB1


class FsuMessage(BaseDB1):
    __tablename__ = "fsu_message"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False)
    remark = Column(Text, nullable=False)
    status = Column(Boolean, nullable=False, default=True)
