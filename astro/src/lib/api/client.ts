import { getAccessToken } from '@js/auth.js';
import type { ApiRequestOptions, QueryParamValue, SseRequestOptions } from './types/client';

// ==== Konfigurasi dasar =====

// Fallback host saat env PUBLIC_BACKEND_PATH belum di-set.
const DEFAULT_BACKEND_BASE_URL = 'http://127.0.0.1:8000';

const rawBackendBaseUrl =
  typeof import.meta.env.PUBLIC_BACKEND_PATH === 'string' &&
  import.meta.env.PUBLIC_BACKEND_PATH.trim().length > 0
    ? import.meta.env.PUBLIC_BACKEND_PATH
    : DEFAULT_BACKEND_BASE_URL;

// Hilangkan trailing slash agar join endpoint jadi bersih.
const API_BASE_URL = rawBackendBaseUrl.replace(/\/+$/, '');

// Tipe utilitas untuk method dan query.
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const logSsrFetch = (payload: Record<string, unknown>) => {
  if (!import.meta.env.SSR) {
    return;
  }
  console.info(`[astro:ssr:fetch] ${JSON.stringify(payload)}`);
};

// ==== Helper pemeriksaan tipe body ====
const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData;

const isURLSearchParams = (value: unknown): value is URLSearchParams =>
  typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;

// Pastikan kita hanya melewatkan body yang valid menurut fetch.
const isBodyInit = (value: unknown): value is BodyInit => {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value as ArrayBufferView)) {
    return true;
  }

  if (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) {
    return true;
  }

  return false;
};

// Serialisasi params object jadi query string.
const toQueryString = (params: Record<string, QueryParamValue>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : '';
};

// Gabungkan base URL, path endpoint, dan query string.
const buildUrl = (endpoint: string, params?: Record<string, QueryParamValue>) => {
  const base = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
  if (!params || Object.keys(params).length === 0) {
    return base;
  }
  const queryString = toQueryString(params);
  if (!queryString) {
    return base;
  }

  return base.includes('?') ? `${base}&${queryString.slice(1)}` : `${base}${queryString}`;
};

// Bentuk body final, otomatis set header JSON jika perlu.
const normalizeBody = (body: unknown, headers: Headers): BodyInit | null => {
  if (body === undefined || body === null) {
    return null;
  }

  if (isBodyInit(body) || isFormData(body) || isURLSearchParams(body)) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
};

// Parser response serbaguna: JSON diprioritaskan, sisanya text.
const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

// Coba keluarkan pesan error paling bermakna dari response gagal.
const extractErrorMessage = async (response: Response) => {
  try {
    const payload = await response.clone().json();
    if (payload?.detail) {
      if (typeof payload.detail === 'string') {
        return payload.detail;
      }
      if (Array.isArray(payload.detail)) {
        const [first] = payload.detail;
        if (first?.msg) {
          return first.msg;
        }
      }
    }
    if (payload?.message) {
      return payload.message;
    }
  } catch (error) {
    // Abaikan kegagalan parse JSON dan lanjutkan ke fallback text.
  }

  try {
    const text = await response.clone().text();
    if (text) {
      return text;
    }
  } catch (error) {
    // Abaikan kegagalan parse text juga.
  }

  return `Request failed with status ${response.status}`;
};

// ==== Fungsi utama eksekusi fetch ====
export async function request<T = unknown>(
  method: HttpMethod,
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, raw, token, headers: initHeaders, body: requestBody, ...rest } = options;

  // Susun URL lengkap + query parameter jika ada.
  const url = buildUrl(endpoint, params);
  const headers = new Headers(initHeaders ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Ambil bearer token otomatis, tapi izinkan override manual.
  const resolvedToken = token ?? getAccessToken();
  if (resolvedToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${resolvedToken}`);
  }

  // Pastikan body sesuai format (JSON bila object biasa).
  const body = normalizeBody(requestBody, headers);

  const startedAt = Date.now();
  let response: Response;
  // Eksekusi fetch dengan default credentials include supaya cookie ikut.
  try {
    response = await fetch(url, {
      ...rest,
      method,
      headers,
      body: body ?? undefined,
      credentials: rest.credentials ?? 'include',
    });
  } catch (error) {
    logSsrFetch({
      method,
      endpoint,
      url,
      durationMs: Date.now() - startedAt,
      error: String(error),
    });
    throw error;
  }

  logSsrFetch({
    method,
    endpoint,
    url,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (raw) {
    return response as unknown as T;
  }

  return (await parseResponse(response)) as T;
}

export function requestSSE(endpoint: string, options: SseRequestOptions = {}) {
  if (typeof globalThis === 'undefined' || typeof globalThis.EventSource === 'undefined') {
    throw new Error('SSE requests require a browser environment that provides EventSource');
  }

  const { params, withCredentials = true, signal } = options;
  const url = buildUrl(endpoint, params);
  const eventSource = new EventSource(url, { withCredentials });

  if (signal) {
    const abortHandler = () => {
      eventSource.close();
      signal.removeEventListener('abort', abortHandler);
    };

    if (signal.aborted) {
      abortHandler();
    } else {
      signal.addEventListener('abort', abortHandler);
    }
  }

  return eventSource;
}

// ==== Wrapper singkat untuk method umum ====
export const apiClient = {
  request,
  sse: (endpoint: string, options?: SseRequestOptions) => requestSSE(endpoint, options),
  get: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>('GET', endpoint, options),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', endpoint, { ...options, body }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', endpoint, { ...options, body }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', endpoint, { ...options, body }),
  delete: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>('DELETE', endpoint, options),
};

// Ekspos base URL agar bisa dipakai di tempat lain bila perlu.
export { API_BASE_URL };
export type { ApiRequestOptions, SseRequestOptions } from './types/client';
