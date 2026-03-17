export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface LookupItem {
  id: string;
  name: string;
  description: string;
}

export type Gender = 'MALE' | 'FEMALE';
export type UserStatus = 'INACTIVE' | 'ACTIVE';
export type TreeRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER';
export type MemberStatus = 'PENDING' | 'ACTIVE';
export type UnionType = 'MARRIED' | 'DIVORCED' | 'PARTNER' | 'OTHER';
export type SharePermission = 'VIEW' | 'EDIT';