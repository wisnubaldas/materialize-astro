import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES: RegExp[] = [
    /^\/auth\/login\/?$/,     // /auth/login atau /auth/login/
    /^\/auth\/register\/?$/,  // /auth/register atau /auth/register/
    /^\/docs/,                // semua path yang diawali /docs
    /^\/landing/,                // semua path yang diawali /docs
    /^\/blog/                 // semua path yang diawali /blog
];
export const onRequest: MiddlewareHandler = async (context, next) => {

    const url = new URL(context.request.url);
    // 🚀 Redirect otomatis dari root "/" ke "/blog/"
    if (url.pathname === "/") {
        return Response.redirect(new URL("/landing", context.url), 302);
    }

    //   const matched = PUBLIC_ROUTES.find((p) => url.pathname.startsWith(p));
    // if (matched) {
    //   console.log("Matched public route:", matched);
    //   return next();
    // }

    // ✅ Cek apakah route termasuk public
    if (PUBLIC_ROUTES.some((pattern) => pattern.test(url.pathname))) {
        console.log("Matched public route:", url.pathname);
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
            `${import.meta.env.PUBLIC_BACKEND_PATH}/auth/verify`,
            {
                headers: { Authorization: `Bearer ${token}` },
                method: "GET"
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
