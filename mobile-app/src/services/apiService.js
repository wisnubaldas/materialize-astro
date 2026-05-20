import { env } from '../config/env';
import { clearAuthStorage, getAuthToken } from './storageService';

const authExpiredListeners = new Set();
let hasNotifiedAuthExpired = false;

/**
 * Registers a listener that runs when the API detects an expired auth token.
 * @param {Function} listener - Callback called after auth storage is cleared.
 * @returns {Function} Unsubscribe callback.
 */
export function addAuthExpiredListener(listener) {
  authExpiredListeners.add(listener);

  return () => {
    authExpiredListeners.delete(listener);
  };
}

/**
 * Allows a new login session to receive future auth expiry notifications.
 * @returns {void}
 */
export function resetAuthExpiredNotification() {
  hasNotifiedAuthExpired = false;
}

/**
 * Notifies the app that the current token is no longer valid.
 * @param {string} message - User-safe session expiry message.
 * @returns {Promise<void>} Resolves after storage and listeners are handled.
 */
async function notifyAuthExpired(message) {
  if (hasNotifiedAuthExpired) {
    return;
  }

  hasNotifiedAuthExpired = true;
  await clearAuthStorage();

  authExpiredListeners.forEach((listener) => {
    listener(message);
  });
}

/**
 * Builds a full backend URL from a relative API path.
 * @param {string} path - Backend path, for example `/auth/me`.
 * @returns {string} Fully qualified URL.
 */
function buildApiUrl(path) {
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Decodes a JWT payload when the runtime supports base64 decoding.
 * @param {string} token - JWT token.
 * @returns {object|null} Decoded payload or null when it cannot be decoded.
 */
function decodeJwtPayload(token) {
  const [, payload] = String(token || '').split('.');

  if (!payload || typeof globalThis.atob !== 'function') {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    );
    return JSON.parse(globalThis.atob(paddedPayload));
  } catch (error) {
    console.info('[api] Token payload tidak bisa dibaca, lanjut validasi via backend.', error);
    return null;
  }
}

/**
 * Checks whether a JWT already expired based on its `exp` claim.
 * @param {string|null} token - Stored JWT token.
 * @returns {boolean} True when token is expired.
 */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return Number(payload.exp) <= nowInSeconds;
}

/**
 * Reads JSON from a fetch response, including empty responses.
 * @param {Response} response - Fetch response object.
 * @returns {Promise<object|null>} Parsed JSON payload.
 */
async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('[api] Gagal membaca response JSON', {
      status: response.status,
      bodyPreview: text.slice(0, 300),
      error,
    });
    return { message: text || 'Response server tidak valid.' };
  }
}

/**
 * Resolves a readable API error message.
 * @param {object|null} data - Parsed backend error response.
 * @returns {string} UI-safe error message.
 */
function resolveErrorMessage(data) {
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const [firstError] = data.detail;

    if (typeof firstError?.msg === 'string' && firstError.msg.trim()) {
      return firstError.msg;
    }
  }

  return data?.message || 'Request gagal diproses.';
}

/**
 * Detects backend responses that indicate an expired JWT.
 * @param {number} status - HTTP status code.
 * @param {object|null} data - Parsed backend response.
 * @returns {boolean} True when the response means the auth session expired.
 */
function isExpiredAuthResponse(status, data) {
  if (status !== 401) {
    return false;
  }

  const message = resolveErrorMessage(data).toLowerCase();
  return message.includes('expired') || message.includes('signature has expired');
}

/**
 * Builds a readable message for failed network requests.
 * @param {unknown} error - Error thrown by fetch.
 * @param {string} url - Target request URL.
 * @returns {string} UI-safe network error message.
 */
function resolveNetworkErrorMessage(error, url) {
  if (error?.name === 'AbortError') {
    return `Request ke backend timeout setelah ${env.apiTimeoutMs / 1000} detik. Periksa API base URL: ${url}`;
  }

  return `Tidak bisa menghubungi backend. Periksa koneksi device/emulator dan API base URL: ${url}`;
}

/**
 * Sends an HTTP request to the backend API.
 * @param {string} path - Relative backend path.
 * @param {{ method?: string, body?: object, headers?: object, authenticated?: boolean }} options - Request options.
 * @returns {Promise<object|null>} Parsed backend response.
 */
export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const url = buildApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.apiTimeoutMs);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.authenticated) {
    const token = await getAuthToken();

    if (token) {
      if (isTokenExpired(token)) {
        const message = 'Session sudah berakhir. Silakan login ulang.';
        await notifyAuthExpired(message);
        throw new Error(message);
      }

      headers.Authorization = `Bearer ${token}`;
    }
  }

  console.info('[api] Request start', { method, url });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const data = await readJsonResponse(response);

    if (!response.ok) {
      console.error('[api] Request failed', { method, url, status: response.status, data });
      if (options.authenticated && isExpiredAuthResponse(response.status, data)) {
        const message = 'Session sudah berakhir. Silakan login ulang.';
        await notifyAuthExpired(message);
        throw new Error(message);
      }
      throw new Error(resolveErrorMessage(data));
    }

    console.info('[api] Request success', { method, url, status: response.status });
    return data;
  } catch (error) {
    if (error?.name === 'AbortError' || error instanceof TypeError) {
      console.error('[api] Request error', { method, url, error });
      throw new Error(resolveNetworkErrorMessage(error, url));
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends a GET request to the backend API.
 * @param {string} path - Relative backend path.
 * @param {{ authenticated?: boolean, headers?: object }} options - Request options.
 * @returns {Promise<object|null>} Parsed backend response.
 */
export function getRequest(path, options = {}) {
  return apiRequest(path, { ...options, method: 'GET' });
}

/**
 * Sends a POST request to the backend API.
 * @param {string} path - Relative backend path.
 * @param {object} body - JSON request body.
 * @param {{ authenticated?: boolean, headers?: object }} options - Request options.
 * @returns {Promise<object|null>} Parsed backend response.
 */
export function postRequest(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'POST', body });
}
