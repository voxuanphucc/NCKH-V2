import type { Gender, UserStatus } from './common';

export interface User {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  avatarUrl: string;
  dateOfBirth: string;
  status: UserStatus;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth: string;
  avatarUrl: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}