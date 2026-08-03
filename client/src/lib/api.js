import axios from "axios";

/**
 * Axios API Singleton Instance
 *
 * Configured with:
 * - Environment variable base URL
 * - HttpOnly Cookie support (withCredentials: true)
 * - Request/Response Interceptors
 * - Timeout guard (15s)
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Interceptor hook for headers, CSRF, or logs if required in future
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const formattedError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      data: error.response?.data?.data || null,
      errors: error.response?.data?.errors || [],
      raw: error,
    };

    return Promise.reject(formattedError);
  }
);

export default api;
