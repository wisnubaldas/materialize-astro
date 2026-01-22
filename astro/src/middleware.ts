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

const fetchUserProfile = async (token: string) => {
  const response = await fetch(AUTH_ENDPOINTS.me, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Failed to fetch profile');
    throw new Error(message || 'Failed to fetch profile');
  }

  return response.json();
};

const attachUser = async (token: string, locals: Record<string, unknown>) => {
  const payload = verifyAccessToken(token);
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

  if (isStaticAsset(pathname)) {
    return next();
  }

  const token = cookies.get(AUTH_COOKIE_NAME)?.value;

  if (pathname === LOGIN_ROUTE) {
    if (!token) {
      return next();
    }

    try {
      await attachUser(token, locals as Record<string, unknown>);
      return redirect(LOGIN_REDIRECT_PATH);
    } catch (error) {
      cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
      console.warn('[auth] gagal verifikasi token untuk halaman login:', error);
      return next();
    }
  }

  if (isPublicPath(pathname)) {
    return next();
  }

  if (!token) {
    return redirect(LOGIN_ROUTE);
  }

  try {
    await attachUser(token, locals as Record<string, unknown>);
    return next();
  } catch (error) {
    cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
    console.warn('[auth] verifikasi token gagal:', error);
    return redirect(LOGIN_ROUTE);
  }
});
