import { defineMiddleware } from 'astro:middleware';
import {
  AUTH_COOKIE_NAME,
  AUTH_ENDPOINTS,
  LOGIN_NEXT_PARAM,
  LOGIN_REDIRECT_PATH,
  LOGIN_ROUTE,
  PUBLIC_PATHS,
} from '@lib/auth/config';

const STATIC_PATH_PREFIXES = [
  '/assets',
  '/_astro',
  '/_image',
  '/favicon',
  '/manifest',
  '/robots',
  '/sitemap',
];

const STATIC_EXTENSIONS = [
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.map',
  '.txt',
];

const isStaticAsset = (pathname) =>
  STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const isSafeInternalPath = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  if (!value.startsWith('/')) {
    return false;
  }

  if (value.startsWith('//')) {
    return false;
  }

  return !value.includes('://');
};

const normalizeRedirectPath = (value, fallback) => (isSafeInternalPath(value) ? value : fallback);

const getLoginNextDestination = (url) => {
  const next = url.searchParams.get(LOGIN_NEXT_PARAM);
  if (!next) {
    return null;
  }
  if (!isSafeInternalPath(next)) {
    return null;
  }
  if (next === LOGIN_ROUTE || next.startsWith(`${LOGIN_ROUTE}/`)) {
    return null;
  }
  return next;
};

const buildLoginRedirectPath = (requestUrl, method) => {
  const loginUrl = new URL(LOGIN_ROUTE, requestUrl);
  if (method === 'GET') {
    const currentPath = `${requestUrl.pathname}${requestUrl.search}`;
    if (
      isSafeInternalPath(currentPath) &&
      currentPath !== LOGIN_ROUTE &&
      !currentPath.startsWith(`${LOGIN_ROUTE}/`)
    ) {
      loginUrl.searchParams.set(LOGIN_NEXT_PARAM, currentPath);
    }
  }
  return loginUrl.pathname + loginUrl.search;
};

const resolvePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PROFILE_CACHE_TTL_MS = resolvePositiveInt(import.meta.env.AUTH_PROFILE_CACHE_TTL_MS, 5 * 60 * 1000);
const MAX_PROFILE_CACHE_ENTRIES = resolvePositiveInt(import.meta.env.AUTH_PROFILE_CACHE_MAX_ENTRIES, 300);

const profileCache = new Map();

const logSsr = (event, payload) => {
  if (!import.meta.env.SSR) {
    return;
  }
  console.info(`[astro:ssr:${event}] ${JSON.stringify(payload)}`);
};

const trimCache = () => {
  while (profileCache.size > MAX_PROFILE_CACHE_ENTRIES) {
    const oldestKey = profileCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    profileCache.delete(oldestKey);
  }
};

const getCachedProfile = (token) => {
  const cached = profileCache.get(token);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    profileCache.delete(token);
    return null;
  }

  return cached.profile;
};

const setCachedProfile = (token, profile) => {
  profileCache.set(token, {
    profile,
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
  });
  trimCache();
};

const fetchUserProfile = async (token) => {
  const startedAt = Date.now();
  let response = null;
  try {
    response = await fetch(AUTH_ENDPOINTS.me, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    logSsr('fetch', {
      source: 'middleware.auth.me',
      method: 'GET',
      url: AUTH_ENDPOINTS.me,
      durationMs: Date.now() - startedAt,
      error: String(error),
    });
    throw error;
  }

  logSsr('fetch', {
    source: 'middleware.auth.me',
    method: 'GET',
    url: AUTH_ENDPOINTS.me,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Failed to fetch profile');
    const error = new Error(message || 'Failed to fetch profile');
    error.status = response.status;
    throw error;
  }

  const profile = await response.json();
  setCachedProfile(token, profile);
  return profile;
};

const attachUser = async (token, locals) => {
  const cachedProfile = getCachedProfile(token);
  if (cachedProfile) {
    locals.user = cachedProfile;
    return;
  }

  const profile = await fetchUserProfile(token);
  locals.user = profile;
};

const clearAuthCookie = (cookies, token) => {
  if (token) {
    profileCache.delete(token);
  }
  cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;
  const isStatic = isStaticAsset(pathname);
  const startedAt = Date.now();
  let response;

  try {
    if (isStatic) {
      response = await next();
      return response;
    }

    const token = cookies.get(AUTH_COOKIE_NAME)?.value;

    if (pathname === LOGIN_ROUTE) {
      if (!token) {
        response = await next();
        return response;
      }

      try {
        await attachUser(token, locals);
        const requestedNext = getLoginNextDestination(url);
        const target = normalizeRedirectPath(requestedNext, LOGIN_REDIRECT_PATH);
        response = redirect(target);
        return response;
      } catch (error) {
        clearAuthCookie(cookies, token);
        response = await next();
        return response;
      }
    }

    if (isPublicPath(pathname)) {
      response = await next();
      return response;
    }

    if (!token) {
      response = redirect(buildLoginRedirectPath(url, context.request.method));
      return response;
    }

    try {
      await attachUser(token, locals);
      response = await next();
      return response;
    } catch (error) {
      clearAuthCookie(cookies, token);
      response = redirect(buildLoginRedirectPath(url, context.request.method));
      return response;
    }
  } finally {
    if (!isStatic) {
      logSsr('request', {
        method: context.request.method,
        path: pathname,
        status: response?.status ?? 0,
        durationMs: Date.now() - startedAt,
      });
    }
  }
});
