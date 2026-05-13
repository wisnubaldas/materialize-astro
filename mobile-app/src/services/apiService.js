import { env } from '../config/env';
import { getAuthToken } from './storageService';

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
