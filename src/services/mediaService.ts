import { request } from '../config/axios';
import type { MediaFile } from '../types/media';
import { validateField, showErrorToast } from '../utils/validation';

export const mediaService = {
  getTreeMedia: (treeId: string) =>
  request<MediaFile[]>(`/trees/${treeId}/media`),

  uploadTreeMedia: (
  treeId: string,
  file: File,
  mediaFileTypeId: string,
  description?: string) =>
  {
    const fileError = validateField('media', 'file', file);
    const mediaTypeError = validateField('media', 'mediaFileTypeId', mediaFileTypeId);

    if (fileError) {
      showErrorToast(fileError);
      return Promise.reject(new Error(fileError));
    }

    if (mediaTypeError) {
      showErrorToast(mediaTypeError);
      return Promise.reject(new Error(mediaTypeError));
    }

    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ mediaFileTypeId });
    if (description) params.append('description', description);
    return request<MediaFile>(`/trees/${treeId}/media?${params}`, {
      method: 'POST',
      body: formData
    });
  },

  deleteTreeMedia: (treeId: string, mediaFileId: string) =>
  request<string>(`/trees/${treeId}/media/${mediaFileId}`, {
    method: 'DELETE'
  }),

  getPersonMedia: (treeId: string, personId: string) =>
  request<MediaFile[]>(`/trees/${treeId}/persons/${personId}/media`),

  uploadPersonMedia: (
  treeId: string,
  personId: string,
  file: File,
  mediaFileTypeId: string,
  description?: string) =>
  {
    const fileError = validateField('media', 'file', file);
    const mediaTypeError = validateField('media', 'mediaFileTypeId', mediaFileTypeId);

    if (fileError) {
      showErrorToast(fileError);
      return Promise.reject(new Error(fileError));
    }

    if (mediaTypeError) {
      showErrorToast(mediaTypeError);
      return Promise.reject(new Error(mediaTypeError));
    }

    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ mediaFileTypeId });
    if (description) params.append('description', description);
    return request<MediaFile>(
      `/trees/${treeId}/persons/${personId}/media?${params}`,
      { method: 'POST', body: formData }
    );
  }
};