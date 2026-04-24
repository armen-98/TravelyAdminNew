import axios from "axios";
import { getSession, signOut } from "next-auth/react";

export type ApiEnvironment = "production" | "staging" | "local";

const API_ENVIRONMENT_URLS: Record<ApiEnvironment, string> = {
  production: "https://api-prod.travely.life/api",
  staging: "https://api-v2.travely.life/api",
  local: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api").replace(
    /\/$/,
    ""
  ),
};

const API_ENV_STORAGE_KEY = "admin_api_environment";

/** Default when nothing is stored in localStorage (local dev first). */
export const DEFAULT_API_ENVIRONMENT: ApiEnvironment = "local";

export function resolveApiBaseUrl(environment: ApiEnvironment): string {
  return API_ENVIRONMENT_URLS[environment];
}

export function getClientApiBaseUrl() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(API_ENV_STORAGE_KEY);
    if (stored === "production" || stored === "staging" || stored === "local") {
      return resolveApiBaseUrl(stored);
    }
  }
  return API_ENVIRONMENT_URLS[DEFAULT_API_ENVIRONMENT];
}

const api = axios.create({
  baseURL: getClientApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiEnvironment(): ApiEnvironment {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(API_ENV_STORAGE_KEY);
    if (stored === "production" || stored === "staging" || stored === "local") {
      return stored;
    }
  }
  return DEFAULT_API_ENVIRONMENT;
}

export function setApiEnvironment(environment: ApiEnvironment) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(API_ENV_STORAGE_KEY, environment);
  }
  api.defaults.baseURL = resolveApiBaseUrl(environment);
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      await signOut({ callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default api;

// Server-side API call with token
export async function serverApi(token: string) {
  return axios.create({
    baseURL: getClientApiBaseUrl(),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
