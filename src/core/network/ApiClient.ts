/**
 * ApiClient - Centralized Axios HTTP client for AutoSuivi.tn
 *
 * Features:
 * - Base URL configured for the backend VPS
 * - Automatic JWT token injection via request interceptor
 * - 401 error handling with automatic logout
 * - Snake_case ↔ camelCase response/request mapping
 * - User-friendly French error messages
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = 'http://102.204.205.49/api';
const TOKEN_KEY = 'autosuivi_token';
const REFRESH_TOKEN_KEY = 'autosuivi_refresh_token';
const TIMEOUT_MS = 20_000; // 20s pour les connexions lentes

// ─── Utility: snake_case ↔ camelCase mapping ─────────────────────────────────

const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/** Recursively convert all keys in an object from snake_case to camelCase */
export const mapResponseKeys = (data: any): any => {
  if (Array.isArray(data)) return data.map(mapResponseKeys);
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.keys(data).reduce((acc: Record<string, any>, key) => {
      acc[snakeToCamel(key)] = mapResponseKeys(data[key]);
      return acc;
    }, {});
  }
  return data;
};

/**
 * Recursively convert all keys in an object from camelCase to snake_case.
 * NOTE: Auth endpoints (register, login, reset-password) expect camelCase keys
 * so we skip conversion for auth-related paths. The conversion is primarily
 * needed for vehicle/maintenance/deadline endpoints.
 */
export const mapRequestKeys = (data: any): any => {
  if (Array.isArray(data)) return data.map(mapRequestKeys);
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    return Object.keys(data).reduce((acc: Record<string, any>, key) => {
      acc[camelToSnake(key)] = mapRequestKeys(data[key]);
      return acc;
    }, {});
  }
  return data;
};

// ─── Paths that should NOT have key conversion (backend expects camelCase) ───
const SKIP_KEY_CONVERSION_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password'];

// ─── User-friendly French error messages by HTTP status ──────────────────────

const getErrorMessageByStatus = (status?: number, serverMessage?: string): string => {
  // If the server already returns a meaningful French message, use it
  if (serverMessage && serverMessage.length > 5 && !serverMessage.toLowerCase().includes('error')) {
    return serverMessage;
  }

  switch (status) {
    case 400:
      return serverMessage || 'Les donn\u00e9es envoy\u00e9es sont incorrectes. V\u00e9rifiez vos informations.';
    case 401:
      return 'Votre session a expir\u00e9. Veuillez vous reconnecter.';
    case 403:
      return 'Acc\u00e8s refus\u00e9. Vous n\u2019avez pas les permissions n\u00e9cessaires.';
    case 404:
      return 'Le service demand\u00e9 est introuvable. R\u00e9essayez plus tard.';
    case 409:
      return serverMessage || 'Cette adresse email est d\u00e9j\u00e0 utilis\u00e9e. Essayez de vous connecter.';
    case 422:
      return serverMessage || 'Les donn\u00e9es fournies sont invalides. V\u00e9rifiez le formulaire.';
    case 429:
      return 'Trop de tentatives. Veuillez patienter quelques minutes avant de r\u00e9essayer.';
    case 500:
    case 502:
    case 503:
      return 'Le serveur rencontre un probl\u00e8me. R\u00e9essayez dans quelques instants.';
    default:
      return serverMessage || 'Une erreur inattendue est survenue. R\u00e9essayez.';
  }
};

const getNetworkErrorMessage = (error: AxiosError): string => {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'La connexion est trop lente. V\u00e9rifiez votre connexion Internet et r\u00e9essayez.';
  }
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Impossible de se connecter au serveur. V\u00e9rifiez votre connexion Internet.';
  }
  if (error.message?.includes('ECONNREFUSED')) {
    return 'Le serveur est temporairement indisponible. R\u00e9essayez plus tard.';
  }
  return 'Probl\u00e8me de connexion. V\u00e9rifiez votre acc\u00e8s Internet et r\u00e9essayez.';
};

// ─── Token helpers ───────────────────────────────────────────────────────────

export const TokenStorage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};

// ─── Logout callback (set by AuthContext) ────────────────────────────────────

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// ─── Axios Instance ──────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor: attach JWT + convert keys ──────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Attach JWT token if available
    const token = await TokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Convert request body keys from camelCase to snake_case
    // SKIP for auth endpoints — backend expects camelCase (e.g. newPassword)
    const requestPath = config.url || '';
    const shouldSkipConversion = SKIP_KEY_CONVERSION_PATHS.some(
      (path) => requestPath.includes(path),
    );

    if (config.data && typeof config.data === 'object' && !shouldSkipConversion) {
      config.data = mapRequestKeys(config.data);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: convert keys + handle 401 ─────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    // Convert response data keys from snake_case to camelCase
    if (response.data) {
      response.data = mapResponseKeys(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear tokens and trigger logout
      await TokenStorage.clearTokens();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    // Build user-friendly French error message
    let message: string;

    if (!error.response) {
      // No response = network/connectivity issue
      message = getNetworkErrorMessage(error);
    } else {
      // Server responded with an error status
      const serverMsg =
        (error.response.data as any)?.message ||
        (error.response.data as any)?.error;
      message = getErrorMessageByStatus(status, serverMsg);
    }

    return Promise.reject(new ApiError(message, status));
  },
);

// ─── Custom Error Class ──────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default apiClient;
