import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  AUTH_ENDPOINTS,
  AUTH_ERRORS,
} from '@lib/auth/config';

const SECURE_CONTEXT =
  typeof window !== 'undefined' && typeof window.location !== 'undefined'
    ? window.location.protocol === 'https:'
    : false;

/**
 * Hitung hash SHA-256 dari string.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Set token auth ke cookie agar bisa diakses SSR.
 * @param {string} token
 * @param {boolean} remember
 */
function setAuthCookie(token, remember) {
  const maxAge = remember ? AUTH_COOKIE_MAX_AGE.remember : AUTH_COOKIE_MAX_AGE.default;
  const secureFlag = SECURE_CONTEXT ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/**
 * Hapus token dari cookie.
 */
function clearAuthCookie() {
  const secureFlag = SECURE_CONTEXT ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
}

/**
 * Ambil token auth dari cookie.
 * @returns {string|null}
 */
function getAccessToken() {
  if (typeof document === 'undefined') {
    return null;
  }
  const value = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!value) {
    return null;
  }

  return value.split('=')[1] || null;
}

/**
 * Kirim request login ke backend FastAPI.
 * @param {{ email: string; password: string; remember?: boolean }} payload
 * @returns {Promise<{ access_token?: string; token_type?: string }>}
 */
async function login(payload) {
  const remember = Boolean(payload.remember);

  try {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (typeof data?.detail === 'string') {
        const normalized = data.detail.toLowerCase();
        const message = normalized.includes('invalid credential')
          ? AUTH_ERRORS.invalidCredentials
          : data.detail;
        throw new Error(message);
      }

      throw new Error(AUTH_ERRORS.generic);
    }

    if (data?.access_token) {
      setAuthCookie(data.access_token, remember);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (!error.message) {
        error.message = AUTH_ERRORS.generic;
      }
      throw error;
    }

    throw new Error(AUTH_ERRORS.generic);
  }
}

/**
 * Logout dari aplikasi.
 */
function logout() {
  clearAuthCookie();
}

export { sha256, login, logout, getAccessToken, clearAuthCookie, AUTH_ERRORS };
