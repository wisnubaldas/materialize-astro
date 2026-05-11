from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.BaseDB1.menu import Menu
from app.models.BaseDB1.role import Role
from app.models.BaseDB1.user import User
from app.models.BaseDB1.user_role import UserRole
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.setting_schema import MenuOut, UserOut
from app.services.datatables_service import DataTablesService


class SettingRepository:
    def __init__(self, db: Session):
        self.db = db
        self.user_datatable_service = DataTablesService(
            model=User,
            schema=UserOut,
            search_columns=["username", "email"],
        )
        self.menu_datatable_service = DataTablesService(
            model=Menu,
            schema=MenuOut,
            search_columns=["name", "url", "icon"],
        )

    def list_users(self) -> list[User]:
        return self.db.query(User).order_by(User.id.desc()).all()

    def users_datatable(self, params: DataTablesParams) -> DataTablesResponse[UserOut]:
        return self.user_datatable_service.get_datatable(db=self.db, params=params)

    def get_user_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_username_or_email(self, username: str, email: str) -> User | None:
        return self.db.query(User).filter(or_(User.username == username, User.email == email)).first()

    def get_user_by_username_except_id(self, username: str, user_id: int) -> User | None:
        return self.db.query(User).filter(User.username == username, User.id != user_id).first()

    def get_user_by_email_except_id(self, email: str, user_id: int) -> User | None:
        return self.db.query(User).filter(User.email == email, User.id != user_id).first()

    def get_user_by_subject(self, subject: str) -> User | None:
        return (
            self.db.query(User)
            .filter(or_(User.email == subject, User.username == subject))
            .first()
        )

    def create_user(self, user: User) -> User:
        self.db.add(user)
        return self._commit_and_refresh(user)

    def save_user(self, user: User) -> User:
        return self._commit_and_refresh(user)

    def delete_user(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()

    def delete_user_roles(self, user_id: int) -> None:
        self.db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        self.db.commit()

    def list_roles(self) -> list[Role]:
        return self.db.query(Role).order_by(Role.id.asc()).all()

    def get_role_by_id(self, role_id: int) -> Role | None:
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_role_by_name(self, role_name: str) -> Role | None:
        return self.db.query(Role).filter(Role.role_name == role_name).first()

    def get_role_by_name_except_id(self, role_name: str, role_id: int) -> Role | None:
        return self.db.query(Role).filter(Role.role_name == role_name, Role.id != role_id).first()

    def count_roles_by_ids(self, role_ids: list[int]) -> int:
        return self.db.query(Role).filter(Role.id.in_(role_ids)).count()

    def list_roles_by_ids(self, role_ids: list[int]) -> list[Role]:
        return self.db.query(Role).filter(Role.id.in_(role_ids)).order_by(Role.role_name.asc()).all()

    def create_role(self, role: Role) -> Role:
        self.db.add(role)
        return self._commit_and_refresh(role)

    def save_role(self, role: Role) -> Role:
        return self._commit_and_refresh(role)

    def delete_role(self, role: Role) -> None:
        self.db.delete(role)
        self.db.commit()

    def detach_role_from_menus(self, role_id: int) -> None:
        self.db.query(Menu).filter(Menu.role_id == role_id).update({Menu.role_id: None})
        self.db.commit()

    def delete_user_roles_by_role_id(self, role_id: int) -> None:
        self.db.query(UserRole).filter(UserRole.role_id == role_id).delete()
        self.db.commit()

    def list_user_roles(self, user_id: int) -> list[Role]:
        return (
            self.db.query(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == user_id)
            .order_by(Role.role_name.asc())
            .all()
        )

    def list_user_role_pairs(self, user_id: int) -> list[tuple[int, str]]:
        return (
            self.db.query(Role.id, Role.role_name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == user_id)
            .all()
        )

    def replace_user_roles(self, user_id: int, role_ids: list[int]) -> None:
        self.db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        for role_id in role_ids:
            self.db.add(UserRole(user_id=user_id, role_id=role_id))
        self.db.commit()

    def list_menus(self, role_id: int | None, parent: int | None) -> list[Menu]:
        query = self.db.query(Menu)
        if role_id is not None:
            query = query.filter(Menu.role_id == role_id)
        if parent is not None:
            query = query.filter(Menu.parent == parent)
        return query.order_by(Menu.parent.asc(), Menu.id.asc()).all()

    def menus_datatable(self, params: DataTablesParams) -> DataTablesResponse[MenuOut]:
        return self.menu_datatable_service.get_datatable(db=self.db, params=params)

    def list_menu_tree_by_role(self, role_id: int | None) -> list[Menu]:
        query = self.db.query(Menu)
        if role_id is not None:
            query = query.filter(or_(Menu.role_id == role_id, Menu.role_id.is_(None)))
        return query.order_by(Menu.parent.asc(), Menu.id.asc()).all()

    def list_all_menus(self) -> list[Menu]:
        return self.db.query(Menu).order_by(Menu.parent.asc(), Menu.id.asc()).all()

    def list_menus_for_role_ids(self, role_ids: list[int]) -> list[Menu]:
        query = self.db.query(Menu)
        if role_ids:
            query = query.filter(or_(Menu.role_id.in_(role_ids), Menu.role_id.is_(None)))
        else:
            query = query.filter(Menu.role_id.is_(None))
        return query.order_by(Menu.parent.asc(), Menu.id.asc()).all()

    def get_menu_by_id(self, menu_id: int) -> Menu | None:
        return self.db.query(Menu).filter(Menu.id == menu_id).first()

    def create_menu(self, menu: Menu) -> Menu:
        self.db.add(menu)
        return self._commit_and_refresh(menu)

    def save_menu(self, menu: Menu) -> Menu:
        return self._commit_and_refresh(menu)

    def delete_menu(self, menu: Menu) -> None:
        self.db.delete(menu)
        self.db.commit()

    def reassign_children_to_root(self, menu_id: int) -> None:
        self.db.query(Menu).filter(Menu.parent == menu_id).update({Menu.parent: 0})
        self.db.commit()

    def _commit_and_refresh(self, record: User | Role | Menu) -> User | Role | Menu:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record
