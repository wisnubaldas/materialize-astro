import { apiClient } from '@lib/api/client';

// RBAC: backend mengembalikan menu tree yang sudah difilter role.
const MENU_TREE_ENDPOINT = '/setting/menus/tree';
const MENU_TREE_ME_ENDPOINT = '/setting/menus/tree/me';

const toPositiveInt = (rawValue, fallback) => {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MENU_CACHE_TTL_MS = toPositiveInt(import.meta.env.SSR_MENU_CACHE_TTL_MS, 60_000);
const MENU_CACHE_MAX_ENTRIES = toPositiveInt(import.meta.env.SSR_MENU_CACHE_MAX_ENTRIES, 300);
const menuCache = new Map();

const normalizeMenuItems = (items = []) =>
  items.map((item) => ({
    ...item,
    subItems: Array.isArray(item?.subItems) ? normalizeMenuItems(item.subItems) : [],
  }));

const makeCacheKey = ({ token, roleId }) => `${roleId ?? 'me'}:${token ?? 'anonymous'}`;

const readCache = (cacheKey) => {
  const cached = menuCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    menuCache.delete(cacheKey);
    return null;
  }
  return cached.data;
};

const trimCache = () => {
  while (menuCache.size > MENU_CACHE_MAX_ENTRIES) {
    const oldestKey = menuCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    menuCache.delete(oldestKey);
  }
};

const writeCache = (cacheKey, data) => {
  menuCache.set(cacheKey, {
    expiresAt: Date.now() + MENU_CACHE_TTL_MS,
    data,
  });
  trimCache();
};

const getMenuData = async ({ token, roleId } = {}) => {
  try {
    // roleId dipakai untuk preview role tertentu (mis. admin/setting).
    // Jika tidak ada roleId, backend memakai user token untuk filter RBAC.
    const hasRoleFilter = roleId !== undefined && roleId !== null;
    const shouldCache = Boolean(token) || hasRoleFilter;
    const cacheKey = shouldCache ? makeCacheKey({ token, roleId }) : null;

    if (cacheKey) {
      const cached = readCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const endpoint = hasRoleFilter ? MENU_TREE_ENDPOINT : MENU_TREE_ME_ENDPOINT;
    const params = hasRoleFilter ? { role_id: roleId } : undefined;
    const data = await apiClient.get(endpoint, {
      params,
      token,
    });

    const normalized = Array.isArray(data) ? normalizeMenuItems(data) : [];
    if (cacheKey) {
      writeCache(cacheKey, normalized);
    }
    return normalized;
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
