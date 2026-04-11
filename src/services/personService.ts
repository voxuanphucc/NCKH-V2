import { request } from '../config/axios';
import type { Person, CreatePersonRequest } from '../types/person';
import type { PaginatedData } from '../types/common';
import { validateField, showErrorToast } from '../utils/validation';

export const personService = {
  getPerson: (id: string) => request<Person>(`/persons/${id}`),

  createPerson: (data: CreatePersonRequest) => {
    const firstNameError = validateField('person', 'firstName', data.firstName);
    const lastNameError = validateField('person', 'lastName', data.lastName);
    const genderError = validateField('person', 'gender', data.gender);
    const dateOfBirthError = validateField('person', 'dateOfBirth', data.dateOfBirth);
    const dateOfDeathError = validateField(
      'person',
      'dateOfDeath',
      data.dateOfDeath,
      data.dateOfBirth
    );
    const citizenIdError = validateField(
      'person',
      'citizenIdentificationNumber',
      data.citizenIdentificationNumber
    );

    const errors = [
      firstNameError,
      lastNameError,
      genderError,
      dateOfBirthError,
      dateOfDeathError,
      citizenIdError
    ].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Person>('/persons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updatePerson: (id: string, data: Partial<CreatePersonRequest>) => {
    const firstNameError =
      data.firstName && validateField('person', 'firstName', data.firstName);
    const lastNameError =
      data.lastName && validateField('person', 'lastName', data.lastName);
    const genderError = data.gender && validateField('person', 'gender', data.gender);
    const dateOfBirthError = validateField('person', 'dateOfBirth', data.dateOfBirth);
    const dateOfDeathError = validateField(
      'person',
      'dateOfDeath',
      data.dateOfDeath,
      data.dateOfBirth
    );
    const citizenIdError =
      data.citizenIdentificationNumber &&
      validateField(
        'person',
        'citizenIdentificationNumber',
        data.citizenIdentificationNumber
      );

    const errors = [
      firstNameError,
      lastNameError,
      genderError,
      dateOfBirthError,
      dateOfDeathError,
      citizenIdError
    ].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Person>(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deletePerson: (id: string) =>
    request<string>(`/persons/${id}`, { method: 'DELETE' }),

  searchPersons: (keyword?: string, page = 0, size = 10) =>
    request<PaginatedData<Person>>(
      `/persons?keyword=${keyword || ''}&page=${page}&size=${size}`
    ),
  uploadAvatar: (personId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<Person>(`/persons/${personId}/upload-avatar`, {
      method: 'PATCH',
      body: formData,
    });
  },
};