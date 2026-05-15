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
      const status = error.response?.status;
      const data = error.response?.data;

      // 1. Tenant access restriction (manual block or grace period expired)
      const restrictionCodes = ["ACCESS_RESTRICTED", "GRACE_PERIOD_EXPIRED"];
      if (status === 403 && restrictionCodes.includes(data?.code)) {
        // Persist details so AccessRestricted page can render them
        sessionStorage.setItem("access_block_info", JSON.stringify(data));

        // EXCEPTION: Don't redirect if we are already on a payment-related page
        const currentPath = window.location.pathname;
        const isPaymentPage =
          currentPath.startsWith("/access-restricted") ||
          currentPath.startsWith("/billing") ||
          currentPath.startsWith("/subscription");

        if (!isPaymentPage) {
          window.location.href = "/access-restricted";
        }
        return Promise.reject(error);
      }

      // 2. Timeout or Network Error
      if (error.code === "ECONNABORTED" || error.message.includes("timeout") || !error.response) {
        setGlobalError({
          type: "network",
          message: "The server is taking too long to respond. Please check your internet connection.",
        });
      }
      // 3. Server Error (5xx)
      else if (status >= 500) {
        setGlobalError({
          type: "server",
          message: data?.message || "Our server encountered an internal error.",
        });
      }
      // 4. Unauthorized (401) - handled by page-specific logic usually, but keep as note

      return Promise.reject(error);
    }
  );
};

