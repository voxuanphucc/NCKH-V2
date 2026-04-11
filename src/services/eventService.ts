import { request } from '../config/axios';
import type {
  TreeEvent,
  CreateEventRequest,
  AddPersonToEventRequest
} from
  '../types/event';
import { validateField, showErrorToast } from '../utils/validation';
export interface CreatePersonEventRequest {
  name: string;
  description?: string;
  startedAt: string;
  endedAt?: string;

  personId: string;
  eventTypeId: string;
  roleName?: string;

  addressId?: string;
}
export const eventService = {
  getTreeEvents: (treeId: string) =>
    request<TreeEvent[]>(`/trees/${treeId}/events`),

  getEvent: (treeId: string, eventId: string) =>
    request<TreeEvent>(`/trees/${treeId}/events/${eventId}`),

  createEvent: (treeId: string, data: CreateEventRequest) => {
    const nameError = validateField('event', 'name', data.event.name);
    const startedAtError = validateField('event', 'startedAt', data.event.startedAt);
    const endedAtError = validateField('event', 'endedAt', data.event.endedAt, data.event.startedAt);

    const errors = [nameError, startedAtError, endedAtError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<TreeEvent>(`/trees/${treeId}/events`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteEvent: (treeId: string, eventId: string) =>
    request<string>(`/trees/${treeId}/events/${eventId}`, { method: 'DELETE' }),

  addPersonToEvent: (
    treeId: string,
    eventId: string,
    data: AddPersonToEventRequest) =>

    request<TreeEvent>(`/trees/${treeId}/events/${eventId}/persons`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  removePersonFromEvent: (treeId: string, eventId: string, personId: string) =>
    request<string>(`/trees/${treeId}/events/${eventId}/persons/${personId}`, {
      method: 'DELETE'
    }),

  getPersonEvents: (treeId: string, personId: string) =>
    request<TreeEvent[]>(`/trees/${treeId}/events/persons/${personId}`),

  updateEvent: (treeId: string, eventId: string, data: CreateEventRequest) => {
    const nameError = validateField('event', 'name', data.event.name);
    const startedAtError = validateField('event', 'startedAt', data.event.startedAt);
    const endedAtError = validateField('event', 'endedAt', data.event.endedAt, data.event.startedAt);

    const errors = [nameError, startedAtError, endedAtError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<TreeEvent>(`/trees/${treeId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  createPersonEvent: (treeId: string, data: CreatePersonEventRequest) => {
    const nameError = validateField('event', 'name', data.name);
    const startedAtError = validateField('event', 'startedAt', data.startedAt);
    const endedAtError = validateField('event', 'endedAt', data.endedAt, data.startedAt);

    if (!data.eventTypeId) {
      showErrorToast('Loại sự kiện là bắt buộc');
      return Promise.reject(new Error('Validation failed'));
    }

    const errors = [nameError, startedAtError, endedAtError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<TreeEvent>(`/trees/${treeId}/events/person-event`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updatePersonEvent: (treeId: string, eventId: string, data: CreatePersonEventRequest) => {
    const nameError = validateField('event', 'name', data.name);
    const startedAtError = validateField('event', 'startedAt', data.startedAt);
    const endedAtError = validateField('event', 'endedAt', data.endedAt, data.startedAt);

    if (!data.eventTypeId) {
      showErrorToast('Loại sự kiện là bắt buộc');
      return Promise.reject(new Error('Validation failed'));
    }

    const errors = [nameError, startedAtError, endedAtError].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach((error) => showErrorToast(error!));
      return Promise.reject(new Error('Validation failed'));
    }

    return request<TreeEvent>(`/trees/${treeId}/events/${eventId}/person-event`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

};