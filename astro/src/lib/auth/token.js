import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from './config.js';

const isSecureContext = () =>
  typeof window !== 'undefined' &&
  typeof window.location !== 'undefined' &&
  window.location.protocol === 'https:';

const buildSecureFlag = () => (isSecureContext() ? '; Secure' : '');

export const setAccessToken = (token, remember = false) => {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = remember ? AUTH_COOKIE_MAX_AGE.remember : AUTH_COOKIE_MAX_AGE.default;
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${buildSecureFlag()}`;
};

export const clearAccessToken = () => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${buildSecureFlag()}`;
};

export const getAccessToken = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!value) {
    return null;
  }

  return value.split('=')[1] || null;
};
