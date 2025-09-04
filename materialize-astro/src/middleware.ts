import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES = ["/auth/login/", "/auth/register/", "/docs"];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);

  // cek route public
  if (PUBLIC_ROUTES.some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  // cek token dari cookies
  const token = context.cookies.get("auth_token")?.value;

  // kalau belum login → redirect ke login + simpan last path
  if (!token) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    return Response.redirect(
      new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
      302
    );
  }

  // validasi token ke backend FastAPI
  try {
    const verify = await fetch(
      `${import.meta.env.PUBLIC_API_URL}/auth/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // console.log(verify);

    if (!verify.ok) {
      const redirectTo = encodeURIComponent(url.pathname + url.search);
      return Response.redirect(
        new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
        302
      );
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    return Response.redirect(
      new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
      302
    );
  }

  return next();
};
