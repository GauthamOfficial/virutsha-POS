import axios from "axios";

const TOKEN_KEY = "virutsha_pos_token";

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const storeToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private-mode browsers block storage; the cookie still covers same-origin.
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clean up.
  }
};

// Where the API lives:
//  - VITE_BACKEND_URL set        -> use it (two separate Vercel projects)
//  - not set, running `npm run dev` -> the local backend on port 8000
//  - not set, built for production  -> same address as the page, which is how
//    the laptop setup runs (the backend serves the built frontend itself)
const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_BACKEND_URL;
  if (configured !== undefined && configured !== "") return configured;
  return import.meta.env.DEV ? "http://localhost:8000" : "";
};

export const axiosWrapper = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Send the saved token on every call. This is what keeps the login working
// when the site and the API sit on two different domains (two Vercel projects),
// where the browser may refuse to send the cookie.
axiosWrapper.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns any backend or network failure into a plain sentence the shop can read.
export const errorMessage = (error) =>
  error?.response?.data?.message ||
  (error?.code === "ERR_NETWORK"
    ? "Cannot reach the server. Is it running?"
    : error?.message) ||
  "Something went wrong.";
