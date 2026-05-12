import { appConfig } from '../config/env.js';
import { getAuthToken } from './storageService.js';

/**
 * Builds a complete API URL using the configured API base URL and endpoint path.
 * @param {string} path - Endpoint path such as "/users/me".
 * @returns {string} Complete API URL.
 */
function buildApiUrl(path) {
  const baseUrl = appConfig.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

/**
 * Safely reads a JSON response, including empty responses.
 * @param {Response} response - Native fetch Response object.
 * @returns {Promise<object|null>} Parsed JSON body or null when response has no body.
 */
async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

/**
 * Sends an HTTP request to the external API with optional Bearer authentication.
 * @param {string} path - Endpoint path relative to the configured API base URL.
 * @param {{ method?: string, body?: object, headers?: object, authenticated?: boolean }} options - Request options.
 * @returns {Promise<object|null>} Parsed API response.
 */
export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (options.authenticated) {
    const token = await getAuthToken();

    // Only attach Authorization when a token exists to avoid malformed headers.
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.detail || 'Request gagal diproses.';
    throw new Error(message);
  }

  return data;
}

/**
 * Sends a GET request to the external API.
 * @param {string} path - Endpoint path relative to the configured API base URL.
 * @param {{ authenticated?: boolean }} options - Optional request flags.
 * @returns {Promise<object|null>} Parsed API response.
 */
export function getRequest(path, options = {}) {
  return apiRequest(path, { ...options, method: 'GET' });
}

/**
 * Sends a POST request to the external API.
 * @param {string} path - Endpoint path relative to the configured API base URL.
 * @param {object} body - Request payload.
 * @param {{ authenticated?: boolean }} options - Optional request flags.
 * @returns {Promise<object|null>} Parsed API response.
 */
export function postRequest(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'POST', body });
}
