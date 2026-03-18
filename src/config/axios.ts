import { env } from './env';
import type { ApiResponse } from '../types/common';
import { showErrorToast } from '../utils/validation';

function getToken(): string | null {
  return localStorage.getItem('access_token');
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

  const response = await fetch(`${env.API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
    errorBody?.message || `HTTP ${response.status}: ${response.statusText}`;
    
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