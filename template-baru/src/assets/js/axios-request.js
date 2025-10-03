import axios from "axios";

let api = {}
api.token = null;
api.axios = axios.create({
    baseURL: import.meta.env.PUBLIC_BACKEND_PATH,
    headers: {
        "Content-Type": "application/json",
    }
});

api.axios.interceptors.request.use(
    (config) => {
        if (api.token) {
            config.headers.Authorization = `Bearer ${api.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api

