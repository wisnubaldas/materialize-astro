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

/**
 * Membuat cache key berdasarkan token dan roleId.
 *
 * @param {Object} options - Parameter cache key.
 * @param {string} [options.token] - Token JWT user.
 * @param {string|number} [options.roleId] - ID role user.
 * @returns {string} Cache key terformat.
 */
const makeCacheKey = ({ token = undefined, roleId = undefined }) => `${roleId ?? 'me'}:${token ?? 'anonymous'}`;

/**
 * Membaca data menu dari cache jika belum kedaluwarsa.
 *
 * @param {string} cacheKey - Key cache yang dicari.
 * @returns {Array|null} Data menu dari cache atau null jika tidak ada/kedaluwarsa.
 */
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

/**
 * Menghapus entri cache tertua jika melebihi batas kapasitas maksimal.
 */
const trimCache = () => {
  while (menuCache.size > MENU_CACHE_MAX_ENTRIES) {
    const oldestKey = menuCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    menuCache.delete(oldestKey);
  }
};

/**
 * Menyimpan data menu ke dalam cache dengan batas waktu kedaluwarsa.
 *
 * @param {string} cacheKey - Key cache.
 * @param {Array} data - Data menu yang akan disimpan.
 */
const writeCache = (cacheKey, data) => {
  menuCache.set(cacheKey, {
    expiresAt: Date.now() + MENU_CACHE_TTL_MS,
    data,
  });
  trimCache();
};

/**
 * Mengambil data menu dari backend dengan caching.
 *
 * @param {Object} [options={}] - Opsi untuk memuat data menu.
 * @param {string} [options.token] - Token JWT user untuk autentikasi.
 * @param {string|number} [options.roleId] - ID role user untuk filtering/preview menu.
 * @returns {Promise<Array>} List menu item yang sudah dinormalisasi.
 */
const getMenuData = async ({ token = undefined, roleId = undefined } = {}) => {
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

/**
 * Menyaring menu berdasarkan kata kunci pencarian pada nama menu.
 *
 * @param {Array} items - List menu item.
 * @param {string} keyword - Kata kunci pencarian.
 * @returns {Array} List menu item yang sesuai.
 */
const filterMenuByName = (items, keyword) => {
  const needle = String(keyword || '').toLowerCase();
  if (!needle) return items;

  return items.filter((item) => String(item?.name || '').toLowerCase().includes(needle));
};

export { filterMenuByName, getMenuData };
