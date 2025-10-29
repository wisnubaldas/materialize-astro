import type { AstroGlobal } from 'astro';
import { AUTH_COOKIE_NAME, LOGIN_ROUTE } from './config';
import { verifyAccessTokenLocally } from './token';

export const ensureAuthenticated = (Astro: AstroGlobal) => {
  const token = Astro.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw Astro.redirect(LOGIN_ROUTE);
  }

  // @ts-ignore - Astro.locals is untyped
  if (!Astro.locals.user) {
    const { payload } = verifyAccessTokenLocally(token);
    // @ts-ignore
    Astro.locals.user = payload;
  }

  // @ts-ignore
  return Astro.locals.user;
};
