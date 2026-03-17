import { request } from '../config/axios';
import type {
  User,
  UpdateUserRequest,
  ChangePasswordRequest } from
'../types/user';
import { validateField, showErrorToast } from '../utils/validation';

export const userService = {
  getMe: () => request<User>('/users/me'),

  updateMe: (data: UpdateUserRequest) => {
    const firstNameError =
      data.firstName && validateField('user', 'firstName', data.firstName);
    const lastNameError =
      data.lastName && validateField('user', 'lastName', data.lastName);
    const phoneError =
      data.phoneNumber && validateField('user', 'phoneNumber', data.phoneNumber);
    const dateOfBirthError = validateField('user', 'dateOfBirth', data.dateOfBirth);

    const errors = [firstNameError, lastNameError, phoneError, dateOfBirthError].filter(
      Boolean
    );

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  changePassword: (data: ChangePasswordRequest) => {
    const oldPasswordError = validateField('auth', 'password', data.oldPassword);
    const newPasswordError = validateField('auth', 'password', data.newPassword);
    const confirmPasswordError = validateField(
      'auth',
      'confirmPassword',
      data.confirmPassword,
      data.newPassword
    );

    const errors = [oldPasswordError, newPasswordError, confirmPasswordError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<string>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  getUser: (id: string) => request<User>(`/users/${id}`)
};