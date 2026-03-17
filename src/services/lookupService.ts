import { request } from '../config/axios';
import type { LookupItem } from '../types/common';

export const lookupService = {
  getAddressTypes: () => request<LookupItem[]>('/lookup/address-types'),
  getEventTypes: () => request<LookupItem[]>('/lookup/event-types'),
  getMediaFileTypes: () => request<LookupItem[]>('/lookup/media-file-types'),
  getRoleInEvents: () => request<LookupItem[]>('/lookup/role-in-events')
};