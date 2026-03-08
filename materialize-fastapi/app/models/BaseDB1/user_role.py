from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class UserRole(BaseDB1):
    """Join table user <-> role (RBAC).

    Satu user bisa punya banyak role; kombinasi user_id+roles_id unik.
    """
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "roles_id", name="uq_user_role"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role_id = Column(
        "roles_id",
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
