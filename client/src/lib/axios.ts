import axios from "axios";

console.log("🔥 AXIOS FILE LOADED");

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

console.log("🔥 API BASE URL:", baseURL);

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  console.log("🔥 REQUEST:", config.method, config.url);

  const token = localStorage.getItem("jwt");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("🔥 API ERROR:", error.response?.status, error.config?.url);

    if (error.response?.status === 401) {
      localStorage.removeItem("jwt");

      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);