import { request } from '../config/axios';
import type { TreeGraph, FamilyInfo, Family } from '../types/family';
import type {
  Person,
  CreatePersonRequest,
  CreateSpouseRequest,
  CreateParentRequest } from
'../types/person';
import { validateField, showErrorToast } from '../utils/validation';

export const familyService = {
  getGraph: (treeId: string) => request<TreeGraph>(`/trees/${treeId}/graph`),

  getPersonFamily: (treeId: string, personId: string) =>
  request<FamilyInfo>(`/trees/${treeId}/persons/${personId}/family`),

  createFirstPerson: (treeId: string, data: CreatePersonRequest) => {
    const firstNameError = validateField('person', 'firstName', data.firstName);
    const lastNameError = validateField('person', 'lastName', data.lastName);
    const genderError = validateField('person', 'gender', data.gender);
    const dateOfBirthError = validateField('person', 'dateOfBirth', data.dateOfBirth);

    const errors = [firstNameError, lastNameError, genderError, dateOfBirthError].filter(
      Boolean
    );

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Person>(`/trees/${treeId}/persons/first`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  addSpouse: (treeId: string, personId: string, data: CreateSpouseRequest) => {
    const firstNameError = validateField('person', 'firstName', data.firstName);
    const lastNameError = validateField('person', 'lastName', data.lastName);
    const genderError = validateField('person', 'gender', data.gender);

    const errors = [firstNameError, lastNameError, genderError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Family>(`/trees/${treeId}/persons/${personId}/spouse`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  addParent: (treeId: string, personId: string, data: CreateParentRequest) => {
    const firstNameError = validateField('person', 'firstName', data.firstName);
    const lastNameError = validateField('person', 'lastName', data.lastName);
    const genderError = validateField('person', 'gender', data.gender);

    const errors = [firstNameError, lastNameError, genderError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Family>(`/trees/${treeId}/persons/${personId}/parent`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  addChild: (treeId: string, familyId: string, data: CreatePersonRequest) => {
    const firstNameError = validateField('person', 'firstName', data.firstName);
    const lastNameError = validateField('person', 'lastName', data.lastName);
    const genderError = validateField('person', 'gender', data.gender);

    const errors = [firstNameError, lastNameError, genderError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Family>(`/trees/${treeId}/families/${familyId}/child`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteFamily: (treeId: string, familyId: string) =>
  request<string>(`/trees/${treeId}/families/${familyId}`, {
    method: 'DELETE'
  }),

  removeChild: (treeId: string, familyId: string, personId: string) =>
  request<string>(
    `/trees/${treeId}/families/${familyId}/children/${personId}`,
    { method: 'DELETE' }
  )
};