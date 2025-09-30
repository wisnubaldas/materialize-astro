// console.log(window);
import { getCookie } from './cookies';
const apiPath = import.meta.env.PUBLIC_BACKEND_PATH;
window.apiPath = apiPath;

document.addEventListener("DOMContentLoaded", () => {
  nodeWaves.init();

  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      const token = getCookie('auth_token');
      if (token) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    },
    error: function (xhr, status, error) {
      // Kalau unauthorized → redirect ke login
      if (xhr.status === 401) {
        window.location.href = '/auth/login/';
      }
    }
  });
});

