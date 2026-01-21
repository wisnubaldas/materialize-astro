from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class Menu(BaseDB1):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(100), nullable=False)
    parent = Column(Integer, nullable=False, default=0, index=True)
    url = Column(Text, nullable=False)
    role_id = Column(Integer, ForeignKey("user_roles.id"), index=True, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    role = relationship("UserRole", back_populates="menus")
