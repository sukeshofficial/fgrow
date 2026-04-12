/**
 * Axios API instance configured with a base URL from environment variables,
 * enabled credentials for authenticated requests, a global timeout,
 * and default JSON response handling.
 */
import axios from "axios";

// Normalize baseURL to prevent double slashes (e.g., /api/v0//path) 
// which trigger redirects that fail CORS preflight requests.
const baseURL = import.meta.env.VITE_API_URL?.endsWith("/")
  ? import.meta.env.VITE_API_URL.slice(0, -1)
  : import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * setupInterceptors
 *
 * Configures global error handling for all API requests.
 */
export const setupInterceptors = (setGlobalError) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // 1. Timeout or Network Error
      if (error.code === "ECONNABORTED" || error.message.includes("timeout") || !error.response) {
        setGlobalError({
          type: "network",
          message: "The server is taking too long to respond. Please check your internet connection.",
        });
      }
      // 2. Server Error (5xx)
      else if (error.response?.status >= 500) {
        setGlobalError({
          type: "server",
          message: error.response.data?.message || "Our server encountered an internal error.",
        });
      }
      // 3. Unauthorized (401) - handled by page-specific logic usually, but keep as note

      return Promise.reject(error);
    }
  );
};
