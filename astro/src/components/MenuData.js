import { apiClient } from '@lib/api/client';

// RBAC: backend mengembalikan menu tree yang sudah difilter role.
const MENU_TREE_ENDPOINT = '/setting/menus/tree';
const MENU_TREE_ME_ENDPOINT = '/setting/menus/tree/me';

const normalizeMenuItems = (items = []) =>
  items.map((item) => ({
    ...item,
    subItems: Array.isArray(item?.subItems) ? normalizeMenuItems(item.subItems) : [],
  }));

const getMenuData = async ({ token, roleId } = {}) => {
  try {
    // roleId dipakai untuk preview role tertentu (mis. admin/setting).
    // Jika tidak ada roleId, backend memakai user token untuk filter RBAC.
    const hasRoleFilter = roleId !== undefined && roleId !== null;
    const endpoint = hasRoleFilter ? MENU_TREE_ENDPOINT : MENU_TREE_ME_ENDPOINT;
    const params = hasRoleFilter ? { role_id: roleId } : undefined;
    const data = await apiClient.get(endpoint, {
      params,
      token,
    });

    return Array.isArray(data) ? normalizeMenuItems(data) : [];
  } catch (error) {
    console.warn('[menu] gagal memuat menu dari backend.', error);
    return [];
  }
};

const filterMenuByName = (items, keyword) => {
  const needle = String(keyword || '').toLowerCase();
  if (!needle) return items;

  return items.filter((item) => String(item?.name || '').toLowerCase().includes(needle));
};

export { filterMenuByName, getMenuData };
