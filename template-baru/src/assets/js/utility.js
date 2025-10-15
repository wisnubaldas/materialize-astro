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
window.modeApp = import.meta.env.MODE;
document.addEventListener("DOMContentLoaded", () => {
    nodeWaves.init();
    const token = getCookie('access_token');
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
            console.error(thrownError)
            // Silent log to avoid noisy console in production
            if (xhr.status === 401) {
                // window.location.href = '/auth/login/';
                console.error(xhr)

            }
        }
    });

});

