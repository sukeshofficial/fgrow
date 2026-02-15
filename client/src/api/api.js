/**
 * Axios API instance configured with a base URL from environment variables,
 * enabled credentials for authenticated requests, a global timeout,
 * and default JSON response handling.
 */
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});
