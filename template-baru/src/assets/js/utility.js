// console.log(window);
import { createNanoEvents } from 'nanoevents';
import { getCookie } from './cookies';
const emitter = createNanoEvents();
try {
  window.globalEmitter = emitter;
  $.globalEmitter = emitter;
} catch (e) { }


const apiPath = import.meta.env.PUBLIC_BACKEND_PATH;
window.apiPath = apiPath;

document.addEventListener("DOMContentLoaded", () => {
  nodeWaves.init();
  const token = getCookie('access_token');
  console.log("Token from cookie client:", token);
  if (!token) {
    window.location.href = '/auth/login/';
  }

  $.ajaxSetup({
    xhrFields: {
      withCredentials: true // <--- WAJIB agar browser simpan cookie dari server
    },
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    error: function (xhr, ajaxOptions, thrownError) {
      console.log(xhr.status);
      console.log(thrownError);
      if (xhr.status === 401) {
        window.location.href = '/auth/login/';
      }
    }
  });

});

