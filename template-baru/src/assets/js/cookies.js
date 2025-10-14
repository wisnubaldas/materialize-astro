export function getCookie(name) {
  // Prefer true cookie to support SSR/middleware access; fallback to localStorage
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const raw = parts.pop().split(';').shift();
    if (raw) return decodeURIComponent(raw);
  }
  return localStorage.getItem(name);
}

export function setCookie(name, value, options = {}) {
  const {
    days = 1,
    path = '/',
    sameSite = 'Lax'
  } = options;
  const maxAge = Math.floor(days * 24 * 60 * 60);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}`;
}

export function removeCookie(name, options = {}) {
  const { path = '/' } = options;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

export function delCookie() {
  document.cookie.split(";").forEach(function (c) {
    const eqPos = c.indexOf("=");
    const nama = eqPos > -1 ? c.substring(0, eqPos) : c;
    document.cookie = nama + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
}

export function clearStorage() {
  // Menghapus semua cookies
  document.cookie.split(";").forEach(function (c) {
    const eqPos = c.indexOf("=");
    const nama = eqPos > -1 ? c.substring(0, eqPos) : c;
    document.cookie = nama + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });

  // // Menghapus localStorage
  localStorage.clear();

  // // Menghapus sessionStorage
  sessionStorage.clear();

  console.log("Semua cookies dan storage berhasil dihapus.");
}
