import { getAccessToken } from '@js/auth.js';

// Fallback host saat env PUBLIC_BACKEND_PATH belum di-set.
const DEFAULT_BACKEND_BASE_URL = 'http://127.0.0.1:8000';
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

const rawBackendBaseUrl =
  typeof import.meta.env.PUBLIC_BACKEND_PATH === 'string' &&
  import.meta.env.PUBLIC_BACKEND_PATH.trim().length > 0
    ? import.meta.env.PUBLIC_BACKEND_PATH
    : DEFAULT_BACKEND_BASE_URL;

// Hilangkan trailing slash agar join endpoint jadi bersih.
const API_BASE_URL = rawBackendBaseUrl.replace(/\/+$/, '');

const resolvePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const REQUEST_TIMEOUT_MS = resolvePositiveInt(
  import.meta.env.PUBLIC_API_TIMEOUT_MS,
  DEFAULT_REQUEST_TIMEOUT_MS
);

const logSsrFetch = (payload) => {
  if (!import.meta.env.SSR) {
    return;
  }
  console.info(`[astro:ssr:fetch] ${JSON.stringify(payload)}`);
};

const isFormData = (value) => typeof FormData !== 'undefined' && value instanceof FormData;
const isURLSearchParams = (value) => typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;

const isBodyInit = (value) => {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) {
    return true;
  }

  if (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) {
    return true;
  }

  return false;
};

const toQueryString = (params) => {
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

const buildUrl = (endpoint, params) => {
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

const normalizeBody = (body, headers) => {
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

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const extractErrorMessage = async (response) => {
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

const extractErrorPayload = async (response) => {
  try {
    const payload = await response.clone().json();
    return payload;
  } catch (error) {
    // Fallback ke text bila body bukan JSON.
  }

  try {
    return await response.clone().text();
  } catch (error) {
    return null;
  }
};

const logClientApiError = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }
  console.error('[frontend][api-error]', payload);
};

const createRequestSignal = (sourceSignal, timeoutMs) => {
  const hasTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;

  if (!hasTimeout && !sourceSignal) {
    return {
      signal: undefined,
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  let timeoutId;

  const onAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (sourceSignal) {
    if (sourceSignal.aborted) {
      controller.abort();
    } else {
      sourceSignal.addEventListener('abort', onAbort);
    }
  }

  if (hasTimeout) {
    timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(new Error('Request timeout exceeded'));
      }
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (sourceSignal) {
      sourceSignal.removeEventListener('abort', onAbort);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
  };
};

const shouldSkipUnauthorizedRedirect = (endpoint) => {
  if (typeof endpoint !== 'string') {
    return false;
  }
  return endpoint.includes('/auth/login') || endpoint.includes('/auth/logout');
};

const handleUnauthorized = (endpoint) => {
  if (import.meta.env.SSR || typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === '/auth/login') {
    return;
  }

  if (shouldSkipUnauthorizedRedirect(endpoint)) {
    return;
  }

  window.location.replace('/auth/login');
};

export async function request(method, endpoint, options = {}) {
  const { params, raw, token, headers: initHeaders, body: requestBody, timeoutMs, signal, ...rest } =
    options;

  const url = buildUrl(endpoint, params);
  const headers = new Headers(initHeaders ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const resolvedToken = token ?? getAccessToken();
  if (resolvedToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${resolvedToken}`);
  }

  const body = normalizeBody(requestBody, headers);

  const effectiveTimeout = resolvePositiveInt(timeoutMs, REQUEST_TIMEOUT_MS);
  const requestSignal = createRequestSignal(signal, effectiveTimeout);

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, {
      ...rest,
      method,
      headers,
      body: body ?? undefined,
      credentials: rest.credentials ?? 'include',
      signal: requestSignal.signal,
    });
  } catch (error) {
    logSsrFetch({
      method,
      endpoint,
      url,
      durationMs: Date.now() - startedAt,
      error: String(error),
    });
    logClientApiError({
      type: 'network',
      method,
      endpoint,
      url,
      durationMs: Date.now() - startedAt,
      error: String(error),
    });
    throw error;
  } finally {
    requestSignal.cleanup();
  }

  logSsrFetch({
    method,
    endpoint,
    url,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(endpoint);
    }

    const serverPayload = await extractErrorPayload(response);
    const message = await extractErrorMessage(response);
    logClientApiError({
      type: 'http',
      method,
      endpoint,
      url,
      status: response.status,
      statusText: response.statusText,
      serverPayload,
      message,
    });
    const error = new Error(message);
    error.status = response.status;
    error.serverPayload = serverPayload;
    throw error;
  }

  if (raw) {
    return response;
  }

  return parseResponse(response);
}

export function requestSSE(endpoint, options = {}) {
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

export const apiClient = {
  request,
  sse: (endpoint, options) => requestSSE(endpoint, options),
  get: (endpoint, options) => request('GET', endpoint, options),
  post: (endpoint, body, options) => request('POST', endpoint, { ...options, body }),
  put: (endpoint, body, options) => request('PUT', endpoint, { ...options, body }),
  patch: (endpoint, body, options) => request('PATCH', endpoint, { ...options, body }),
  delete: (endpoint, options) => request('DELETE', endpoint, options),
};

export { API_BASE_URL, REQUEST_TIMEOUT_MS };
