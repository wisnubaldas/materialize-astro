import { AUTH_COOKIE_NAME, AUTH_ENDPOINTS, LOGIN_ROUTE } from './config';

export const ensureAuthenticated = async (Astro) => {
  const token = Astro.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw Astro.redirect(LOGIN_ROUTE);
  }

  if (Astro.locals?.user) {
    return Astro.locals.user;
  }

  const response = await fetch(AUTH_ENDPOINTS.me, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    credentials: 'include',
  }).catch(() => null);

  if (!response || !response.ok) {
    Astro.cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
    throw Astro.redirect(LOGIN_ROUTE);
  }

  const user = await response.json();
  Astro.locals.user = user;
  return user;
};
