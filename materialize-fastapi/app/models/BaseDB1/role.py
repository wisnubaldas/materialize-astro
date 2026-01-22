from sqlalchemy import Boolean, Column, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class Role(BaseDB1):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(100), unique=True, nullable=False)
    active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    menus = relationship("Menu", back_populates="role")
    user_roles = relationship("UserRole", back_populates="role")
