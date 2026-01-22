from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_r, get_db1_w
from app.models.BaseDB1.menu import Menu
from app.models.BaseDB1.role import Role
from app.models.BaseDB1.user import User
from app.models.BaseDB1.user_role import UserRole
from app.schemas.setting_schema import (
    MenuCreate,
    MenuOut,
    MenuTreeOut,
    MenuUpdate,
    RoleCreate,
    RoleOut,
    RoleUpdate,
    UserRolesUpdate,
    UserCreate,
    UserOut,
    UserPasswordUpdate,
    UserUpdate,
)
from app.utils.auth_util import hash_password, verify_password

router = APIRouter(prefix="/setting", tags=["Setting"])


def build_menu_tree(menus: list[Menu]) -> list[dict]:
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


@router.get("/users", response_model=list[UserOut], summary="List users")
def list_users(db: Session = Depends(get_db1_r)):
    return db.query(User).order_by(User.id.desc()).all()


@router.get("/users/{user_id}", response_model=UserOut, summary="Detail user")
def get_user(user_id: int, db: Session = Depends(get_db1_r)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user


@router.post(
    "/users",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
)
def create_user(payload: UserCreate, db: Session = Depends(get_db1_w)):
    username = payload.username.strip()
    email = payload.email.strip().lower()
    existing = (
        db.query(User)
        .filter(or_(User.username == username, User.email == email))
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Username atau email sudah digunakan")

    user = User(username=username, email=email, password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut, summary="Update user")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db1_w)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)
    if "username" in data:
        username = data["username"].strip()
        if username != user.username:
            exists = (
                db.query(User)
                .filter(User.username == username, User.id != user_id)
                .first()
            )
            if exists:
                raise HTTPException(status_code=409, detail="Username sudah digunakan")
        user.username = username

    if "email" in data:
        email = data["email"].strip().lower()
        if email != user.email:
            exists = (
                db.query(User)
                .filter(User.email == email, User.id != user_id)
                .first()
            )
            if exists:
                raise HTTPException(status_code=409, detail="Email sudah digunakan")
        user.email = email

    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/password", summary="Ubah password user")
def update_user_password(
    user_id: int,
    payload: UserPasswordUpdate,
    db: Session = Depends(get_db1_w),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    if payload.current_password and not verify_password(payload.current_password, user.password):
        raise HTTPException(status_code=400, detail="Password lama tidak sesuai")

    user.password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password berhasil diubah"}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user")
def delete_user(user_id: int, db: Session = Depends(get_db1_w)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users/{user_id}/roles", response_model=list[RoleOut], summary="List user roles")
def list_user_roles(user_id: int, db: Session = Depends(get_db1_r)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return (
        db.query(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id)
        .order_by(Role.role_name.asc())
        .all()
    )


@router.put(
    "/users/{user_id}/roles",
    response_model=list[RoleOut],
    summary="Update user roles",
)
def update_user_roles(
    user_id: int,
    payload: UserRolesUpdate,
    db: Session = Depends(get_db1_w),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    role_ids = list({int(role_id) for role_id in payload.role_ids if role_id is not None})
    if role_ids:
        roles_count = db.query(Role).filter(Role.id.in_(role_ids)).count()
        if roles_count != len(role_ids):
            raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    for role_id in role_ids:
        db.add(UserRole(user_id=user_id, role_id=role_id))

    db.commit()

    if not role_ids:
        return []

    return (
        db.query(Role).filter(Role.id.in_(role_ids)).order_by(Role.role_name.asc()).all()
    )


@router.get("/roles", response_model=list[RoleOut], summary="List roles")
def list_roles(db: Session = Depends(get_db1_r)):
    return db.query(Role).order_by(Role.id.asc()).all()


@router.post(
    "/roles",
    response_model=RoleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create role",
)
def create_role(payload: RoleCreate, db: Session = Depends(get_db1_w)):
    role_name = payload.role_name.strip()
    existing = db.query(Role).filter(Role.role_name == role_name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Role sudah digunakan")

    role = Role(role_name=role_name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleOut, summary="Update role")
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db1_w)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)
    if "role_name" in data:
        role_name = data["role_name"].strip()
        if role_name != role.role_name:
            existing = (
                db.query(Role).filter(Role.role_name == role_name, Role.id != role_id)
                .first()
            )
            if existing:
                raise HTTPException(status_code=409, detail="Role sudah digunakan")
        role.role_name = role_name

    db.commit()
    db.refresh(role)
    return role


@router.delete(
    "/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete role"
)
def delete_role(role_id: int, db: Session = Depends(get_db1_w)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    db.query(Menu).filter(Menu.role_id == role_id).update({Menu.role_id: None})
    db.query(UserRole).filter(UserRole.role_id == role_id).delete()
    db.delete(role)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/menus", response_model=list[MenuOut], summary="List menus")
def list_menus(
    role_id: int | None = Query(default=None),
    parent: int | None = Query(default=None),
    db: Session = Depends(get_db1_r),
):
    query = db.query(Menu)
    if role_id is not None:
        query = query.filter(Menu.role_id == role_id)
    if parent is not None:
        query = query.filter(Menu.parent == parent)
    return query.order_by(Menu.parent.asc(), Menu.id.asc()).all()


@router.get("/menus/tree", response_model=list[MenuTreeOut], summary="List menus (tree)")
def list_menu_tree(
    role_id: int | None = Query(default=None),
    db: Session = Depends(get_db1_r),
):
    query = db.query(Menu)
    if role_id is not None:
        query = query.filter(or_(Menu.role_id == role_id, Menu.role_id.is_(None)))
    menus = query.order_by(Menu.parent.asc(), Menu.id.asc()).all()
    return build_menu_tree(menus)


@router.post(
    "/menus",
    response_model=MenuOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create menu",
)
def create_menu(payload: MenuCreate, db: Session = Depends(get_db1_w)):
    if payload.role_id is not None:
        role = db.query(Role).filter(Role.id == payload.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan")

    if payload.parent:
        parent_menu = db.query(Menu).filter(Menu.id == payload.parent).first()
        if not parent_menu:
            raise HTTPException(status_code=400, detail="Parent menu tidak ditemukan")

    menu = Menu(
        name=payload.name.strip(),
        url=payload.url.strip(),
        icon=(payload.icon or "").strip(),
        parent=payload.parent,
        role_id=payload.role_id,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


@router.put("/menus/{menu_id}", response_model=MenuOut, summary="Update menu")
def update_menu(menu_id: int, payload: MenuUpdate, db: Session = Depends(get_db1_w)):
    menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)
    if "role_id" in data:
        role_id = data["role_id"]
        if role_id is not None:
            role = db.query(Role).filter(Role.id == role_id).first()
            if not role:
                raise HTTPException(status_code=404, detail="Role tidak ditemukan")
        menu.role_id = role_id

    if "parent" in data:
        parent = data["parent"]
        if parent and parent == menu.id:
            raise HTTPException(status_code=400, detail="Parent menu tidak valid")
        if parent:
            parent_menu = db.query(Menu).filter(Menu.id == parent).first()
            if not parent_menu:
                raise HTTPException(status_code=400, detail="Parent menu tidak ditemukan")
        menu.parent = parent if parent is not None else menu.parent

    if "name" in data:
        menu.name = data["name"].strip()
    if "url" in data:
        menu.url = data["url"].strip()
    if "icon" in data:
        menu.icon = (data["icon"] or "").strip()

    db.commit()
    db.refresh(menu)
    return menu


@router.delete(
    "/menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete menu"
)
def delete_menu(menu_id: int, db: Session = Depends(get_db1_w)):
    menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")

    db.query(Menu).filter(Menu.parent == menu_id).update({Menu.parent: 0})
    db.delete(menu)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
