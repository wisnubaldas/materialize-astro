import { apiClient } from './client';
import type {
  Menu,
  MenuCreatePayload,
  MenuTree,
  MenuUpdatePayload,
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
  User,
  UserCreatePayload,
  UserPasswordPayload,
  UserUpdatePayload,
} from './types/setting';

const USERS_ENDPOINT = '/setting/users';
const ROLES_ENDPOINT = '/setting/roles';
const MENUS_ENDPOINT = '/setting/menus';
const MENUS_TREE_ENDPOINT = '/setting/menus/tree';

const settingClient = {
  listUsers: () => apiClient.get<User[]>(USERS_ENDPOINT),
  getUser: (id: number | string) => apiClient.get<User>(`${USERS_ENDPOINT}/${id}`),
  createUser: (payload: UserCreatePayload) => apiClient.post<User>(USERS_ENDPOINT, payload),
  updateUser: (id: number | string, payload: UserUpdatePayload) =>
    apiClient.put<User>(`${USERS_ENDPOINT}/${id}`, payload),
  deleteUser: (id: number | string) => apiClient.delete(`${USERS_ENDPOINT}/${id}`),
  updateUserPassword: (id: number | string, payload: UserPasswordPayload) =>
    apiClient.patch(`${USERS_ENDPOINT}/${id}/password`, payload),

  listRoles: () => apiClient.get<Role[]>(ROLES_ENDPOINT),
  createRole: (payload: RoleCreatePayload) => apiClient.post<Role>(ROLES_ENDPOINT, payload),
  updateRole: (id: number | string, payload: RoleUpdatePayload) =>
    apiClient.put<Role>(`${ROLES_ENDPOINT}/${id}`, payload),
  deleteRole: (id: number | string) => apiClient.delete(`${ROLES_ENDPOINT}/${id}`),

  listMenus: (params?: { role_id?: number | null; parent?: number | null }) =>
    apiClient.get<Menu[]>(MENUS_ENDPOINT, { params }),
  listMenuTree: (params?: { role_id?: number | null }) =>
    apiClient.get<MenuTree[]>(MENUS_TREE_ENDPOINT, { params }),
  createMenu: (payload: MenuCreatePayload) => apiClient.post<Menu>(MENUS_ENDPOINT, payload),
  updateMenu: (id: number | string, payload: MenuUpdatePayload) =>
    apiClient.put<Menu>(`${MENUS_ENDPOINT}/${id}`, payload),
  deleteMenu: (id: number | string) => apiClient.delete(`${MENUS_ENDPOINT}/${id}`),
};

export default settingClient;
export type {
  Menu,
  MenuCreatePayload,
  MenuTree,
  MenuUpdatePayload,
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
  User,
  UserCreatePayload,
  UserPasswordPayload,
  UserUpdatePayload,
} from './types/setting';
