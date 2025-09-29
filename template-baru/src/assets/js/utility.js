// console.log(window);
import { getCookie } from './cookies';

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
