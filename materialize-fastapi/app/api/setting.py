from fastapi import APIRouter, Depends, Query, Request, Response, status

from app.dependencies.setting_deps import get_setting_service_r, get_setting_service_w
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.setting_schema import (
    MenuCreate,
    MenuOut,
    MenuTreeOut,
    MenuUpdate,
    RoleCreate,
    RoleOut,
    RoleUpdate,
    UserCreate,
    UserOut,
    UserPasswordUpdate,
    UserRolesUpdate,
    UserUpdate,
)
from app.services.setting_service import SettingService

router = APIRouter(prefix="/setting", tags=["Setting"])


@router.get("/users", response_model=list[UserOut], summary="List users")
def list_users(setting_service: SettingService = Depends(get_setting_service_r)):
    return setting_service.list_users()


@router.post(
    "/users/datatables",
    response_model=DataTablesResponse[UserOut],
    summary="List users (datatables)",
)
def list_users_datatables(
    params: DataTablesParams,
    setting_service: SettingService = Depends(get_setting_service_r),
):
    return setting_service.list_users_datatables(params)


@router.get("/users/{user_id}", response_model=UserOut, summary="Detail user")
def get_user(user_id: int, setting_service: SettingService = Depends(get_setting_service_r)):
    return setting_service.get_user(user_id)


@router.post(
    "/users",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
)
def create_user(
    payload: UserCreate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.create_user(payload)


@router.put("/users/{user_id}", response_model=UserOut, summary="Update user")
def update_user(
    user_id: int,
    payload: UserUpdate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.update_user(user_id=user_id, payload=payload)


@router.patch("/users/{user_id}/password", summary="Ubah password user")
def update_user_password(
    user_id: int,
    payload: UserPasswordUpdate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.update_user_password(user_id=user_id, payload=payload)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user")
def delete_user(
    user_id: int,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    setting_service.delete_user(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users/{user_id}/roles", response_model=list[RoleOut], summary="List user roles")
def list_user_roles(
    user_id: int,
    setting_service: SettingService = Depends(get_setting_service_r),
):
    return setting_service.list_user_roles(user_id)


@router.put(
    "/users/{user_id}/roles",
    response_model=list[RoleOut],
    summary="Update user roles",
)
def update_user_roles(
    user_id: int,
    payload: UserRolesUpdate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.update_user_roles(user_id=user_id, payload=payload)


@router.get("/roles", response_model=list[RoleOut], summary="List roles")
def list_roles(setting_service: SettingService = Depends(get_setting_service_r)):
    return setting_service.list_roles()


@router.post(
    "/roles",
    response_model=RoleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create role",
)
def create_role(
    payload: RoleCreate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.create_role(payload)


@router.put("/roles/{role_id}", response_model=RoleOut, summary="Update role")
def update_role(
    role_id: int,
    payload: RoleUpdate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.update_role(role_id=role_id, payload=payload)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete role")
def delete_role(
    role_id: int,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    setting_service.delete_role(role_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/menus", response_model=list[MenuOut], summary="List menus")
def list_menus(
    role_id: int | None = Query(default=None),
    parent: int | None = Query(default=None),
    setting_service: SettingService = Depends(get_setting_service_r),
):
    return setting_service.list_menus(role_id=role_id, parent=parent)


@router.post(
    "/menus/datatables",
    response_model=DataTablesResponse[MenuOut],
    summary="List menus (datatables)",
)
def list_menus_datatables(
    params: DataTablesParams,
    setting_service: SettingService = Depends(get_setting_service_r),
):
    return setting_service.list_menus_datatables(params)


@router.get("/menus/tree", response_model=list[MenuTreeOut], summary="List menus (tree)")
def list_menu_tree(
    role_id: int | None = Query(default=None),
    setting_service: SettingService = Depends(get_setting_service_r),
):
    return setting_service.list_menu_tree(role_id=role_id)


@router.get(
    "/menus/tree/me",
    response_model=list[MenuTreeOut],
    summary="List menus (tree) for current user",
)
def list_menu_tree_for_user(
    request: Request,
    setting_service: SettingService = Depends(get_setting_service_r),
):
    subject = request.scope.get("user", {}).get("username")
    return setting_service.list_menu_tree_for_user(subject)


@router.post(
    "/menus",
    response_model=MenuOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create menu",
)
def create_menu(
    payload: MenuCreate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.create_menu(payload)


@router.put("/menus/{menu_id}", response_model=MenuOut, summary="Update menu")
def update_menu(
    menu_id: int,
    payload: MenuUpdate,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    return setting_service.update_menu(menu_id=menu_id, payload=payload)


@router.delete("/menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete menu")
def delete_menu(
    menu_id: int,
    setting_service: SettingService = Depends(get_setting_service_w),
):
    setting_service.delete_menu(menu_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
