import { request } from '../config/axios';
import { env } from '../config/env';
import type { LoginRequest, RegisterRequest, AuthData } from '../types/auth';
import { validateField, showErrorToast } from '../utils/validation';

export const authService = {
  login: (data: LoginRequest) => {
    // Validate before sending request
    const userNameError = validateField('auth', 'userName', data.userName);
    const passwordError = validateField('auth', 'password', data.password);

    if (userNameError) {
      showErrorToast(userNameError);
      return Promise.reject(new Error(userNameError));
    }

    if (passwordError) {
      showErrorToast(passwordError);
      return Promise.reject(new Error(passwordError));
    }

    return request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  register: (data: RegisterRequest) => {
    // Validate before sending request
    const userNameError = validateField('auth', 'userName', data.userName);
    const emailError = validateField('auth', 'email', data.email);
    const passwordError = validateField('auth', 'password', data.password);
    const firstNameError = validateField('auth', 'firstName', data.firstName);
    const lastNameError = validateField('auth', 'lastName', data.lastName);
    const phoneError = validateField('auth', 'phoneNumber', data.phoneNumber);

    const errors = [
      userNameError,
      emailError,
      passwordError,
      firstNameError,
      lastNameError,
      phoneError
    ].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  googleAuthUrl: () => `${env.API_URL}/auth/oauth2/authorize/google`
};