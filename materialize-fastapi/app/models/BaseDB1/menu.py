from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class Menu(BaseDB1):
    """Menu navigation yang dipakai UI + RBAC.

    Catatan RBAC:
    - role_id NULL berarti menu "public" (bisa dilihat semua role).
    - role_id terisi berarti menu hanya muncul untuk role tersebut.
    """
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(100), nullable=False)
    parent = Column(Integer, nullable=False, default=0, index=True)
    url = Column(Text, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), index=True, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    role = relationship("Role", back_populates="menus")
