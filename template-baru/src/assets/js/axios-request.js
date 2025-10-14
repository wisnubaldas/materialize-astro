import axios from "axios";
import { getCookie } from "./cookies";

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
    const token = api.token || getCookie('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api

