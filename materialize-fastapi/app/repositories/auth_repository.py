from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.BaseDB1.role import Role
from app.models.BaseDB1.user import User
from app.models.BaseDB1.user_role import UserRole


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_subject(self, subject: str) -> User | None:
        return (
            self.db.query(User)
            .filter(or_(User.email == subject, User.username == subject))
            .first()
        )

    def get_role_names_by_user_id(self, user_id: int) -> list[str]:
        roles = (
            self.db.query(Role.role_name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == user_id)
            .order_by(Role.role_name.asc())
            .all()
        )
        return [item.role_name for item in roles]
