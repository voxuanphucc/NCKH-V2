// Quản lý state (Redux, Zustand...)
// Combine các reducers / stores tại đây

export { initialAuthState } from './slices/authSlice';
export type { AuthState } from './slices/authSlice';

// Khi tích hợp Zustand hoặc Redux, export store từ đây
// Ví dụ:
// import { create } from 'zustand'
// export const useStore = create(...)