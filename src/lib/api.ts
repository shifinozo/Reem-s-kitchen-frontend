import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiEnvelope } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * The access token lives in memory plus sessionStorage; the refresh token is
 * an httpOnly cookie the browser sends automatically. Keeping the access token
 * out of localStorage limits its exposure, and sessionStorage lets a page
 * reload restore the session without a refresh round-trip.
 */
let accessToken: string | null = null;
const TOKEN_KEY = 'rk_access_token';

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === 'undefined') return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem(TOKEN_KEY);
  }
  return accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the refresh cookie
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * On a 401, refresh once and replay the original request. Concurrent 401s
 * share a single refresh call so a dashboard firing six requests at once
 * does not trigger six token rotations.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = data?.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // Never try to refresh the refresh call itself, or a failed login.
    const isAuthEndpoint =
      url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/logout');

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;

      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;

      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }

      // Refresh failed — the session is genuinely over.
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/staff') || path.startsWith('/admin')) {
          window.location.href = `/login?expired=1&next=${encodeURIComponent(path)}`;
        }
      }
    }

    return Promise.reject(error);
  },
);

/** Normalised error shape thrown to callers. */
export interface ApiErrorShape {
  message: string;
  status: number;
  errors?: Record<string, string>;
  data?: unknown;
}

export function toApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const body = response?.data as ApiEnvelope<unknown> | undefined;

    if (!response) {
      return {
        message: 'Cannot reach the server. Check that the API is running and try again.',
        status: 0,
      };
    }

    return {
      message: body?.message || error.message || 'Something went wrong',
      status: response.status,
      errors: body?.errors,
      data: body?.data,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Something went wrong',
    status: 500,
  };
}

/** Thin typed wrappers that unwrap the { success, data } envelope. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await api.get<ApiEnvelope<T>>(url, config);
  return data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const { data } = await api.post<ApiEnvelope<T>>(url, body, config);
  return data;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const { data } = await api.patch<ApiEnvelope<T>>(url, body, config);
  return data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await api.delete<ApiEnvelope<T>>(url, config);
  return data;
}

/**
 * Downloads a report and hands the browser a file.
 * Reports are admin-only, so this goes through the authenticated client
 * rather than a plain anchor href.
 */
export async function downloadFile(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
