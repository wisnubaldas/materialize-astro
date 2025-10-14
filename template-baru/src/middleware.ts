import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES: RegExp[] = [
  /^\/auth\/login\/?$/,
  /^\/auth\/register\/?$/,
  /^\/docs/,
  /^\/landing/,
  /^\/blog/,
  /^\/$/ // allow index as public landing
];

// Decode JWT payload (base64url) without verifying signature
function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Hindari infinite loop bila ada request internal khusus
  if (context.request.headers.get("x-internal-auth-check") === "1") {
    return next();
  }

  const url = new URL(context.request.url);

  // 1) Redirect '/landing' -> '/'
  if (url.pathname === "/landing" || url.pathname === "/landing/") {
    return Response.redirect(new URL(`/`, context.url), 302);
  }

  // 2) Lewatkan route publik (termasuk index sebagai landing)
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(url.pathname))) {
    return next();
  }

  // 3) Ambil token dari cookie (SSR)
  const token = context.cookies.get("access_token")?.value;
  if (!token) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    return Response.redirect(new URL(`/auth/login/?redirect=${redirectTo}`, context.url), 302);
  }

  // 4) Verifikasi lokal token (cek exp tanpa request ke backend)
  const payload = decodeJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);
  if (!payload || (typeof payload.exp === "number" && payload.exp < now)) {
    context.cookies.delete("access_token", { path: "/" });
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    return Response.redirect(new URL(`/auth/login/?redirect=${redirectTo}`, context.url), 302);
  }

  // 5) Lolos → lanjut render halaman
  return next();
};
