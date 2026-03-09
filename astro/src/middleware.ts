import { defineMiddleware } from 'astro:middleware';
import { AUTH_COOKIE_NAME, AUTH_ENDPOINTS, LOGIN_REDIRECT_PATH, LOGIN_ROUTE, PUBLIC_PATHS } from '@lib/auth/config';
import { verifyAccessTokenLocally } from '@lib/auth/token';

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

const isStaticAsset = (pathname: string) =>
  STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const verifyAccessToken = (token: string) => verifyAccessTokenLocally(token).payload;

const resolvePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PROFILE_CACHE_TTL_MS = resolvePositiveInt(import.meta.env.AUTH_PROFILE_CACHE_TTL_MS, 5 * 60 * 1000);
const MAX_PROFILE_CACHE_ENTRIES = resolvePositiveInt(import.meta.env.AUTH_PROFILE_CACHE_MAX_ENTRIES, 300);

type ProfileCacheValue = {
  expiresAt: number;
  profile: Record<string, unknown>;
};

const profileCache = new Map<string, ProfileCacheValue>();

const logSsr = (event: string, payload: Record<string, unknown>) => {
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

const getCachedProfile = (token: string) => {
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

const setCachedProfile = (token: string, profile: Record<string, unknown>) => {
  profileCache.set(token, {
    profile,
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
  });
  trimCache();
};

const fetchUserProfile = async (token: string) => {
  const startedAt = Date.now();
  let response: Response | null = null;
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
    throw new Error(message || 'Failed to fetch profile');
  }

  const profile = (await response.json()) as Record<string, unknown>;
  setCachedProfile(token, profile);
  return profile;
};

const attachUser = async (token: string, locals: Record<string, unknown>) => {
  const payload = verifyAccessToken(token);
  locals.user = payload;

  const cachedProfile = getCachedProfile(token);
  if (cachedProfile) {
    locals.user = { ...payload, ...cachedProfile };
    return;
  }

  try {
    const profile = await fetchUserProfile(token);
    locals.user = { ...payload, ...profile };
  } catch (error) {
    console.warn('[auth] gagal mengambil profil user:', error);
    locals.user = payload;
  }
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;
  const isStatic = isStaticAsset(pathname);
  const startedAt = Date.now();
  let response: Response | undefined;

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
        await attachUser(token, locals as Record<string, unknown>);
        response = redirect(LOGIN_REDIRECT_PATH);
        return response;
      } catch (error) {
        cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
        console.warn('[auth] gagal verifikasi token untuk halaman login:', error);
        response = await next();
        return response;
      }
    }

    if (isPublicPath(pathname)) {
      response = await next();
      return response;
    }

    if (!token) {
      response = redirect(LOGIN_ROUTE);
      return response;
    }

    try {
      await attachUser(token, locals as Record<string, unknown>);
      response = await next();
      return response;
    } catch (error) {
      cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
      console.warn('[auth] verifikasi token gagal:', error);
      response = redirect(LOGIN_ROUTE);
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
