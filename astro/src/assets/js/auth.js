import {
  AUTH_ENDPOINTS,
  AUTH_ERRORS,
} from '@lib/auth/config';
import { clearAccessToken, getAccessToken, setAccessToken } from '@lib/auth/token.js';

const resolveAuthErrorMessage = (payload) => {
  if (!payload) {
    return AUTH_ERRORS.generic;
  }

  if (typeof payload?.detail === 'string') {
    const normalized = payload.detail.toLowerCase();
    return normalized.includes('invalid credential') ? AUTH_ERRORS.invalidCredentials : payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    const [first] = payload.detail;
    if (typeof first?.msg === 'string' && first.msg.trim()) {
      return first.msg;
    }
  }

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return AUTH_ERRORS.generic;
};

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
      clearAccessToken();
      throw new Error(resolveAuthErrorMessage(data));
    }

    if (data?.access_token) {
      setAccessToken(data.access_token, remember);
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
async function logout() {
  clearAccessToken();
  try {
    await fetch(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('[auth] logout gagal:', error);
  } finally {
    clearAccessToken();
  }
}

export { AUTH_ERRORS, clearAccessToken as clearAuthCookie, getAccessToken, login, logout, sha256 };
