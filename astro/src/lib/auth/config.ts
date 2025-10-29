const DEFAULT_BASE_URL = 'http://127.0.0.1:8000';

const rawBaseUrl =
  typeof import.meta.env.PUBLIC_AUTH_API_BASE_URL === 'string' &&
  import.meta.env.PUBLIC_AUTH_API_BASE_URL.trim().length > 0
    ? import.meta.env.PUBLIC_AUTH_API_BASE_URL
    : DEFAULT_BASE_URL;

const AUTH_API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const AUTH_COOKIE_NAME = 'access_token';

export const AUTH_ENDPOINTS = {
  login: `${AUTH_API_BASE_URL}/auth/login`,
} as const;

export const AUTH_COOKIE_MAX_AGE = {
  default: 60 * 60 * 2, // 2 hours
  remember: 60 * 60 * 24 * 30, // 30 days
} as const;

export const LOGIN_REDIRECT_PATH = '/';
export const LOGIN_ROUTE = '/auth/login';

export const PUBLIC_PATHS = [LOGIN_ROUTE];

export const AUTH_ERRORS = {
  invalidCredentials: 'Email atau password salah.',
  generic: 'Gagal masuk, silakan coba kembali.',
} as const;
