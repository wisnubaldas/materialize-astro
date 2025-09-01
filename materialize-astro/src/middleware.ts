import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES = ["/auth/login/", "/auth/register/", "/docs/"];

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);

  // Cek apakah halaman termasuk public
  if (PUBLIC_ROUTES.some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  // Cek token dari cookies (rekomendasi)
  const token = context.cookies.get("auth_token")?.value;

  if (!token) {
    // Belum login → redirect ke login
    return Response.redirect(new URL("/auth/login/", context.url), 302);
  }

  // Kalau sudah ada token, bisa validasi ke backend FastAPI
  // (misalnya dengan fetch ke /auth/verify)
  try {
    const verify = await fetch(
      `${import.meta.env.PUBLIC_API_URL}/auth/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!verify.ok) {
      return Response.redirect(new URL("/login/", context.url), 302);
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    return Response.redirect(new URL("/login/", context.url), 302);
  }

  return next();
};
