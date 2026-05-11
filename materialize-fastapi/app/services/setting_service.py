from fastapi import HTTPException, status

from app.models.BaseDB1.menu import Menu
from app.models.BaseDB1.role import Role
from app.models.BaseDB1.user import User
from app.repositories.setting_repository import SettingRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.setting_schema import (
    MenuCreate,
    MenuOut,
    MenuUpdate,
    RoleCreate,
    RoleUpdate,
    UserCreate,
    UserOut,
    UserPasswordUpdate,
    UserRolesUpdate,
    UserUpdate,
)
from app.utils.auth_util import hash_password, verify_password


class SettingService:
    def __init__(self, repo: SettingRepository):
        self.repository = repo

    def list_users(self) -> list[User]:
        return self.repository.list_users()

    def list_users_datatables(self, params: DataTablesParams) -> DataTablesResponse[UserOut]:
        return self.repository.users_datatable(params)

    def get_user(self, user_id: int) -> User:
        user = self.repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return user

    def create_user(self, payload: UserCreate) -> User:
        username = payload.username.strip()
        email = payload.email.strip().lower()
        existing = self.repository.get_user_by_username_or_email(username=username, email=email)
        if existing:
            raise HTTPException(status_code=409, detail="Username atau email sudah digunakan")

        user = User(username=username, email=email, password=hash_password(payload.password))
        return self.repository.create_user(user)

    def update_user(self, user_id: int, payload: UserUpdate) -> User:
        user = self.get_user(user_id)
        data = payload.model_dump(exclude_unset=True)

        if "username" in data:
            self._update_username(user, data["username"], user_id)
        if "email" in data:
            self._update_email(user, data["email"], user_id)

        return self.repository.save_user(user)

    def update_user_password(self, user_id: int, payload: UserPasswordUpdate) -> dict[str, str]:
        user = self.get_user(user_id)
        if payload.current_password and not verify_password(payload.current_password, user.password):
            raise HTTPException(status_code=400, detail="Password lama tidak sesuai")

        user.password = hash_password(payload.new_password)
        self.repository.save_user(user)
        return {"detail": "Password berhasil diubah"}

    def delete_user(self, user_id: int) -> None:
        user = self.get_user(user_id)
        self.repository.delete_user_roles(user_id)
        self.repository.delete_user(user)

    def list_user_roles(self, user_id: int) -> list[Role]:
        self.get_user(user_id)
        return self.repository.list_user_roles(user_id)

    def update_user_roles(self, user_id: int, payload: UserRolesUpdate) -> list[Role]:
        self.get_user(user_id)
        role_ids = self._deduplicate_role_ids(payload.role_ids)

        if role_ids:
            roles_count = self.repository.count_roles_by_ids(role_ids)
            if roles_count != len(role_ids):
                raise HTTPException(status_code=404, detail="Role tidak ditemukan")

        self.repository.replace_user_roles(user_id=user_id, role_ids=role_ids)
        if not role_ids:
            return []
        return self.repository.list_roles_by_ids(role_ids)

    def list_roles(self) -> list[Role]:
        return self.repository.list_roles()

    def create_role(self, payload: RoleCreate) -> Role:
        role_name = payload.role_name.strip()
        existing = self.repository.get_role_by_name(role_name)
        if existing:
            raise HTTPException(status_code=409, detail="Role sudah digunakan")

        role = Role(role_name=role_name)
        return self.repository.create_role(role)

    def update_role(self, role_id: int, payload: RoleUpdate) -> Role:
        role = self._get_role_or_404(role_id)
        data = payload.model_dump(exclude_unset=True)

        if "role_name" in data:
            role_name = data["role_name"].strip()
            if role_name != role.role_name:
                existing = self.repository.get_role_by_name_except_id(role_name, role_id)
                if existing:
                    raise HTTPException(status_code=409, detail="Role sudah digunakan")
            role.role_name = role_name

        return self.repository.save_role(role)

    def delete_role(self, role_id: int) -> None:
        role = self._get_role_or_404(role_id)
        self.repository.detach_role_from_menus(role_id)
        self.repository.delete_user_roles_by_role_id(role_id)
        self.repository.delete_role(role)

    def list_menus(self, role_id: int | None, parent: int | None) -> list[Menu]:
        return self.repository.list_menus(role_id=role_id, parent=parent)

    def list_menus_datatables(self, params: DataTablesParams) -> DataTablesResponse[MenuOut]:
        return self.repository.menus_datatable(params)

    def list_menu_tree(self, role_id: int | None) -> list[dict]:
        menus = self.repository.list_menu_tree_by_role(role_id=role_id)
        return self._build_menu_tree(menus)

    def list_menu_tree_for_user(self, subject: str | None) -> list[dict]:
        if not subject:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

        user = self.repository.get_user_by_subject(subject)
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")

        roles = self.repository.list_user_role_pairs(user.id)
        role_ids = [role_id for role_id, _ in roles]
        role_names = {role_name.lower() for _, role_name in roles}

        if "admin" in role_names:
            menus = self.repository.list_all_menus()
        else:
            menus = self.repository.list_menus_for_role_ids(role_ids)

        return self._build_menu_tree(menus)

    def create_menu(self, payload: MenuCreate) -> Menu:
        self._validate_role_for_menu(payload.role_id)
        self._validate_menu_parent(payload.parent)

        menu = Menu(
            name=payload.name.strip(),
            url=payload.url.strip(),
            icon=(payload.icon or "").strip(),
            parent=payload.parent,
            role_id=payload.role_id,
        )
        return self.repository.create_menu(menu)

    def update_menu(self, menu_id: int, payload: MenuUpdate) -> Menu:
        menu = self._get_menu_or_404(menu_id)
        data = payload.model_dump(exclude_unset=True)

        if "role_id" in data:
            role_id = data["role_id"]
            self._validate_role_for_menu(role_id)
            menu.role_id = role_id

        if "parent" in data:
            self._validate_and_assign_parent(menu, data["parent"])

        if "name" in data:
            menu.name = data["name"].strip()
        if "url" in data:
            menu.url = data["url"].strip()
        if "icon" in data:
            menu.icon = (data["icon"] or "").strip()

        return self.repository.save_menu(menu)

    def delete_menu(self, menu_id: int) -> None:
        menu = self._get_menu_or_404(menu_id)
        self.repository.reassign_children_to_root(menu_id)
        self.repository.delete_menu(menu)

    @staticmethod
    def _build_menu_tree(menus: list[Menu]) -> list[dict]:
        items: dict[int, dict] = {}
        roots: list[dict] = []

        for menu in menus:
            items[menu.id] = {
                "id": menu.id,
                "name": menu.name,
                "url": menu.url,
                "icon": menu.icon,
                "parent": menu.parent,
                "role_id": menu.role_id,
                "created_at": menu.created_at,
                "subItems": [],
            }

        for menu in menus:
            item = items[menu.id]
            parent_id = menu.parent or 0
            if parent_id and parent_id in items:
                items[parent_id]["subItems"].append(item)
            else:
                roots.append(item)

        return roots

    def _update_username(self, user: User, username: str, user_id: int) -> None:
        cleaned = username.strip()
        if cleaned != user.username:
            exists = self.repository.get_user_by_username_except_id(cleaned, user_id)
            if exists:
                raise HTTPException(status_code=409, detail="Username sudah digunakan")
        user.username = cleaned

    def _update_email(self, user: User, email: str, user_id: int) -> None:
        cleaned = email.strip().lower()
        if cleaned != user.email:
            exists = self.repository.get_user_by_email_except_id(cleaned, user_id)
            if exists:
                raise HTTPException(status_code=409, detail="Email sudah digunakan")
        user.email = cleaned

    @staticmethod
    def _deduplicate_role_ids(role_ids: list[int]) -> list[int]:
        return list({int(role_id) for role_id in role_ids if role_id is not None})

    def _get_role_or_404(self, role_id: int) -> Role:
        role = self.repository.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan")
        return role

    def _validate_role_for_menu(self, role_id: int | None) -> None:
        if role_id is None:
            return
        role = self.repository.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    def _get_menu_or_404(self, menu_id: int) -> Menu:
        menu = self.repository.get_menu_by_id(menu_id)
        if not menu:
            raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
        return menu

    def _validate_menu_parent(self, parent: int | None) -> None:
        if not parent:
            return
        parent_menu = self.repository.get_menu_by_id(parent)
        if not parent_menu:
            raise HTTPException(status_code=400, detail="Parent menu tidak ditemukan")

    def _validate_and_assign_parent(self, menu: Menu, parent: int | None) -> None:
        if parent and parent == menu.id:
            raise HTTPException(status_code=400, detail="Parent menu tidak valid")
        if parent:
            parent_menu = self.repository.get_menu_by_id(parent)
            if not parent_menu:
                raise HTTPException(status_code=400, detail="Parent menu tidak ditemukan")
        if parent is not None:
            menu.parent = parent
