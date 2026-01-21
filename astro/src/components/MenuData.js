import { apiClient } from '@lib/api/client';

const MENU_TREE_ENDPOINT = '/setting/menus/tree';

const normalizeMenuItems = (items = []) =>
  items.map((item) => ({
    ...item,
    subItems: Array.isArray(item?.subItems) ? normalizeMenuItems(item.subItems) : [],
  }));

const getMenuData = async ({ token, roleId } = {}) => {
  try {
    const params = roleId === undefined || roleId === null ? undefined : { role_id: roleId };
    const data = await apiClient.get(MENU_TREE_ENDPOINT, {
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
