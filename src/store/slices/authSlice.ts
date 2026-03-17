// Auth state slice
// Hiện tại auth state được quản lý trong hooks/useAuth.tsx
// File này dành cho mở rộng sau khi tích hợp Redux/Zustand

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  userId: string | null;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  userId: null
};

// Placeholder cho Redux/Zustand slice
// Khi cần, có thể chuyển logic từ hooks/useAuth.tsx sang đây