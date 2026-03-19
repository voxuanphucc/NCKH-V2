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
    const message =
    errorBody?.message || `HTTP ${response.status}: ${response.statusText}`;
    
    // Debug log để xem backend trả gì (không log token)
    // Chỉ log khi đang ở môi trường dev (localhost) và KHÔNG phải 404
    if (window.location.hostname === 'localhost' && response.status !== 404) {
      // eslint-disable-next-line no-console
      console.error('API error detail:', {
        url,
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
    }
    
    // Show error toast based on status code
    if (response.status === 401) {
      showErrorToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (response.status === 403) {
      showErrorToast('Bạn không có quyền để thực hiện hành động này');
    } else if (response.status === 404) {
      // Silently handle 404 errors (optional endpoints may not be implemented yet)
      // showErrorToast('Tài nguyên không được tìm thấy');
    } else if (response.status === 409) {
      showErrorToast('Xung đột dữ liệu: ' + message);
    } else if (response.status >= 500) {
      showErrorToast('Lỗi máy chủ, vui lòng thử lại sau');
    } else if (response.status >= 400) {
      showErrorToast(message);
    }
    
    throw new Error(message);
  }

  return response.json();
}