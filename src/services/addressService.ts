import { request } from '../config/axios';
import type { Address, CreateAddressRequest } from '../types/address';
import { validateField, showErrorToast } from '../utils/validation';

export const addressService = {
  getPersonAddresses: (treeId: string, personId: string) =>
  request<Address[]>(`/trees/${treeId}/persons/${personId}/addresses`),

  addPersonAddress: (
  treeId: string,
  personId: string,
  data: CreateAddressRequest) => {

    const formattedAddressError = validateField('address', 'formattedAddress', data.formattedAddress);
    const addressLineError = validateField('address', 'addressLine', data.addressLine);
    const fromDateError = validateField('address', 'fromDate', data.fromDate);

    const errors = [formattedAddressError, addressLineError, fromDateError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Address>(`/trees/${treeId}/persons/${personId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updatePersonAddress: (
  treeId: string,
  personId: string,
  addressId: string,
  data: CreateAddressRequest) => {

    const formattedAddressError = validateField('address', 'formattedAddress', data.formattedAddress);
    const addressLineError = validateField('address', 'addressLine', data.addressLine);
    const fromDateError = validateField('address', 'fromDate', data.fromDate);

    const errors = [formattedAddressError, addressLineError, fromDateError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Address>(
      `/trees/${treeId}/persons/${personId}/addresses/${addressId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
  },

  deletePersonAddress: (treeId: string, personId: string, addressId: string) =>
  request<string>(
    `/trees/${treeId}/persons/${personId}/addresses/${addressId}`,
    { method: 'DELETE' }
  ),

  getTreeAddresses: (treeId: string) =>
  request<Address[]>(`/trees/${treeId}/addresses`),

  addTreeAddress: (treeId: string, data: CreateAddressRequest) => {
    const formattedAddressError = validateField('address', 'formattedAddress', data.formattedAddress);
    const addressLineError = validateField('address', 'addressLine', data.addressLine);
    const fromDateError = validateField('address', 'fromDate', data.fromDate);

    const errors = [formattedAddressError, addressLineError, fromDateError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Address>(`/trees/${treeId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTreeAddress: (
  treeId: string,
  addressId: string,
  data: CreateAddressRequest) => {

    const formattedAddressError = validateField('address', 'formattedAddress', data.formattedAddress);
    const addressLineError = validateField('address', 'addressLine', data.addressLine);
    const fromDateError = validateField('address', 'fromDate', data.fromDate);

    const errors = [formattedAddressError, addressLineError, fromDateError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<Address>(`/trees/${treeId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTreeAddress: (treeId: string, addressId: string) =>
  request<string>(`/trees/${treeId}/addresses/${addressId}`, {
    method: 'DELETE'
  })
};