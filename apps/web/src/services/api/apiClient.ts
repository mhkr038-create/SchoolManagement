import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../app/store/useAuthStore';

const getApiBaseUrl = (): string => {
  // 1. Explicit Vite environment variable replaced at build time
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/+$/, '')}/api/v1`;
  }
  // 2. Production fallback when running on Render static hosting
  if (typeof window !== 'undefined' && window.location.hostname.includes('school-erp-web.onrender.com')) {
    return 'https://school-erp-api.onrender.com/api/v1';
  }
  // 3. Default local dev proxy
  return '/api/v1';
};

export const apiBaseUrl = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Access Token & School Header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, school } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (school?.id) {
      config.headers['X-School-Id'] = school.id;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh Rotation on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap standard envelope if present
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid refresh loops on login/refresh endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
