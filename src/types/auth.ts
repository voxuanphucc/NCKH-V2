import type { Gender } from './common';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth: string;
}

export interface AuthData {
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  accessToken: string;
  tokenType: string;
}