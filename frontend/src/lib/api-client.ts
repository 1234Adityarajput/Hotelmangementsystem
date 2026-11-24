import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!envUrl) {
    return "https://hotelmangementsystem-vi4c.onrender.com/api/v1";
  }
  const cleanUrl = envUrl.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
};

const API_BASE_URL = getBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: attach bearer token if present in localStorage or cookies
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("hotel_admin_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: standardized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clear token on 401 Unauthorized and redirect to login if not already there
      localStorage.removeItem("hotel_admin_token");
      localStorage.removeItem("hotel_admin_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
