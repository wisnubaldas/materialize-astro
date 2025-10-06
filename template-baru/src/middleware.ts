import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES: RegExp[] = [
    /^\/auth\/login\/?$/,
    /^\/auth\/register\/?$/,
    /^\/docs/,
    /^\/landing/,
    /^\/blog/
];

export const onRequest: MiddlewareHandler = async (context, next) => {
    const url = new URL(context.request.url);

    // 1️⃣ Redirect dari "/" → "/landing"
    if (url.pathname === "/") {
        return Response.redirect(new URL("/landing", context.url), 302);
    }

    // 2️⃣ Lewatkan route publik
    if (PUBLIC_ROUTES.some((pattern) => pattern.test(url.pathname))) {
        return next();
    }

    // 3️⃣ Ambil token dari cookie frontend (bukan dari backend)
    const token = context.cookies.get("access_token")?.value;
    if (!token) {
        const redirectTo = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(
            new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
            302
        );
    }

    // 4️⃣ Verifikasi token ke backend FastAPI
    try {
        // Pastikan URL backend berbentuk absolut saat dijalankan di middleware (Node.js)
        const rawBackendPath = (import.meta.env.PUBLIC_BACKEND_PATH ?? "").trim();
        const trimmedBackendPath = rawBackendPath.replace(/\/+$/, "");

        const isAbsoluteBackend = /^https?:\/\//i.test(trimmedBackendPath);
        const normalizedBackendPath = trimmedBackendPath
            ? trimmedBackendPath.startsWith("/")
                ? trimmedBackendPath
                : `/${trimmedBackendPath}`
            : "";
        const relativeVerifyPath = normalizedBackendPath
            ? `${normalizedBackendPath}/auth/verify`
            : "/auth/verify";

        const verifyUrl = isAbsoluteBackend
            ? `${trimmedBackendPath}/auth/verify`
            : new URL(relativeVerifyPath, context.url).toString();

        const verifyResponse = await fetch(verifyUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }, // ✅ gunakan Authorization header
            credentials: "include", // kirim cookie backend juga kalau ada
        });

        // kalau backend tidak valid → redirect ke login
        if (!verifyResponse.ok) {
            const redirectTo = encodeURIComponent(url.pathname + url.search);
            return Response.redirect(
                new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
                302
            );
        }

        // (opsional) simpan data user ke context.locals
        // const verifyData = await verifyResponse.json();
        // context.locals.user = verifyData.username;

    } catch (err) {
        console.error("Auth verify failed:", err);
        const redirectTo = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(
            new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
            302
        );
    }

    // 5️⃣ Lolos → lanjut render halaman
    return next();
};
