import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Primary auth is the httpOnly session cookie set by the backend during OAuth.
// If an explicit token is present in localStorage (used by non-browser / test
// clients), attach it as a Bearer header — the backend accepts either.
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" && window.localStorage.getItem("rr_token");
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

export default api;
