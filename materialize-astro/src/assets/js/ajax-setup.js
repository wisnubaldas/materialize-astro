import $ from "jquery";


// Fungsi untuk ambil token dari cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Global setup untuk semua AJAX request
$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    const token = getCookie("auth_token");
    if (token) {
      xhr.setRequestHeader("Authorization", "Bearer " + token);
    }
  },
  error: function (xhr, status, error) {
    // Kalau unauthorized → redirect ke login
    if (xhr.status === 401) {
      window.location.href = "/auth/login/";
    }
  },
});

export default $;
