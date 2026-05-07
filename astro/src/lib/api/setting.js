import { apiClient } from './client';

const USERS_ENDPOINT = '/setting/users';
const ROLES_ENDPOINT = '/setting/roles';
const MENUS_ENDPOINT = '/setting/menus';
const MENUS_TREE_ENDPOINT = '/setting/menus/tree';

const settingClient = {
  listUsers: () => apiClient.get(USERS_ENDPOINT),
  getUser: (id) => apiClient.get(`${USERS_ENDPOINT}/${id}`),
  createUser: (payload) => apiClient.post(USERS_ENDPOINT, payload),
  updateUser: (id, payload) => apiClient.put(`${USERS_ENDPOINT}/${id}`, payload),
  deleteUser: (id) => apiClient.delete(`${USERS_ENDPOINT}/${id}`),
  updateUserPassword: (id, payload) => apiClient.patch(`${USERS_ENDPOINT}/${id}/password`, payload),
  listUserRoles: (id) => apiClient.get(`${USERS_ENDPOINT}/${id}/roles`),
  updateUserRoles: (id, payload) => apiClient.put(`${USERS_ENDPOINT}/${id}/roles`, payload),

  listRoles: () => apiClient.get(ROLES_ENDPOINT),
  createRole: (payload) => apiClient.post(ROLES_ENDPOINT, payload),
  updateRole: (id, payload) => apiClient.put(`${ROLES_ENDPOINT}/${id}`, payload),
  deleteRole: (id) => apiClient.delete(`${ROLES_ENDPOINT}/${id}`),

  listMenus: (params) => apiClient.get(MENUS_ENDPOINT, { params }),
  listMenuTree: (params) => apiClient.get(MENUS_TREE_ENDPOINT, { params }),
  createMenu: (payload) => apiClient.post(MENUS_ENDPOINT, payload),
  updateMenu: (id, payload) => apiClient.put(`${MENUS_ENDPOINT}/${id}`, payload),
  deleteMenu: (id) => apiClient.delete(`${MENUS_ENDPOINT}/${id}`),
};

export default settingClient;
