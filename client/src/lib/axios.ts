import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // needed to send/receive the httpOnly refresh-token cookie
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Attach the access token (stored in localStorage) to every request.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Token-refresh state ──────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processPendingQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

// ── Response interceptor ─────────────────────────────────────────────────────
// On a 401 from any protected route, silently call POST /auth/refresh to get a
// new access token, update localStorage, then replay the failed request.
// Concurrent 401s are queued so we only call /refresh once.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh");
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register");

    // Don't retry refresh/login/register or already-retried requests
    if (!is401 || isRefreshEndpoint || isAuthEndpoint || originalRequest?._retry) {
      if (is401 && !isAuthEndpoint) {
        localStorage.removeItem("accessToken");
        delete axiosInstance.defaults.headers.common["Authorization"];
      }
      return Promise.reject(error);
    }

    // Mark so we don't retry again if the replayed request also 401s
    originalRequest._retry = true;

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axiosInstance.post<{ accessToken: string }>("/auth/refresh");
      const newAccessToken = data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      processPendingQueue(null, newAccessToken);

      if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      } else {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processPendingQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      delete axiosInstance.defaults.headers.common["Authorization"];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);