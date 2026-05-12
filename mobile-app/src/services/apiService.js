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
  return text ? JSON.parse(text) : null;
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
 * Sends an HTTP request to the backend API.
 * @param {string} path - Relative backend path.
 * @param {{ method?: string, body?: object, headers?: object, authenticated?: boolean }} options - Request options.
 * @returns {Promise<object|null>} Parsed backend response.
 */
export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
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

  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    console.error('[api] Request failed', { path, status: response.status, data });
    throw new Error(resolveErrorMessage(data));
  }

  return data;
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
