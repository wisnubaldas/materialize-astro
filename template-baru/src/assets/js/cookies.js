export function getCookie(name) {
  // ambil dari local storage aja, karena kalau di cookie kadang ada masalah CORS
  return localStorage.getItem(name);
  // const value = `; ${document.cookie}`;
  // const parts = value.split(`; ${name}=`);
  // if (parts.length === 2) return parts.pop().split(';').shift();
  // return null;
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
