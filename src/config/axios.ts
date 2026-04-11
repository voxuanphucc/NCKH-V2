import { env } from './env';
import type { ApiResponse } from '../types/common';
import { showErrorToast } from '../utils/validation';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function joinUrl(baseUrl: string, endpoint: string): string {
  const base = (baseUrl || '').replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already includes `/api/v1` or caller already passed it in endpoint, don't duplicate.
  const hasApiV1InBase = /\/api\/v1$/i.test(base) || /\/api\/v1\//i.test(base);
  const hasApiV1InPath = /^\/api\/v1(\/|$)/i.test(path);

  const finalPath = hasApiV1InBase || hasApiV1InPath ? path : `/api/v1${path}`;
  return `${base}${finalPath}`;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {})
  : Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = joinUrl(env.API_URL, endpoint);
  if (!env.API_URL) {
    // Keep behavior predictable in dev: give a clear message instead of calling a relative URL silently.
    showErrorToast('Chưa cấu hình VITE_API_URL cho frontend');
    throw new Error('Missing VITE_API_URL');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    const validationErrors = errorBody?.data;
    let message =
      errorBody?.message || `HTTP ${response.status}: ${response.statusText}`;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) message = String(firstError);
    }

    // handle status
    if (response.status === 400 && validationErrors) {
      // 👇 throw structured error
      throw {
        type: 'validation',
        message,
        errors: validationErrors
      };
    }

    showErrorToast(message);
    throw new Error(message);
  }

  return response.json();
}