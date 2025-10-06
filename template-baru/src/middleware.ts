import type { MiddlewareHandler } from "astro";

const PUBLIC_ROUTES: RegExp[] = [
    /^\/auth\/login\/?$/,
    /^\/auth\/register\/?$/,
    /^\/docs/,
    /^\/landing/,
    /^\/blog/
];

export const onRequest: MiddlewareHandler = async (context, next) => {
    // 🚫 Hindari infinite loop ketika middleware melakukan fetch ke backend sendiri.
    //    Request internal akan menyertakan header khusus agar middleware dilewati.
    if (context.request.headers.get("x-internal-auth-check") === "1") {
        return next();
    }
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
    console.log("token found in cookie:", token);
    // 4️⃣ Verifikasi token ke backend FastAPI
    try {
        // @ts-ignore
        const verifyUrl = `${import.meta.env.PUBLIC_BACKEND_PATH}/auth/verify`;

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10_000); // ⏱️ batasi waktu tunggu fetch

        const verifyResponse = await fetch(verifyUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "x-internal-auth-check": "1",
            }, // ✅ gunakan Authorization header & tandai request internal
            credentials: "include", // kirim cookie backend juga kalau ada
            signal: abortController.signal,
        }).finally(() => clearTimeout(timeoutId));
        // kalau backend tidak valid → redirect ke login
        if (!verifyResponse.ok) {
            console.error("Request gagal:", verifyResponse.status);
            const errorText = await verifyResponse.text(); // <-- tangkap isi response (plain text)
            console.log("Isi response error:", errorText);

            // ❌ Token invalid/expired — hapus cookies & redirect
            context.cookies.delete("access_token", { path: "/" });

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
        if ((err as Error).name === "AbortError") {
            console.error("Auth verify aborted karena timeout saat menghubungi backend.");
        } else {
            console.error("Auth verify failed:", err);
        }
        const redirectTo = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(
            new URL(`/auth/login/?redirect=${redirectTo}`, context.url),
            302
        );
    }

    // 5️⃣ Lolos → lanjut render halaman
    return next();
};
