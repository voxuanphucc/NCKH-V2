import { request } from '../config/axios';
import type {
  ShareLink,
  CreateShareLinkRequest,
  InviteRequest } from
'../types/invitation';
import type { Tree } from '../types/tree';
import type { TreeGraph } from '../types/family';
import { validateField, showErrorToast } from '../utils/validation';

export const invitationService = {
  getShareLinks: (treeId: string) =>
  request<ShareLink[]>(`/trees/${treeId}/share-links`),

  createShareLink: (treeId: string, data: CreateShareLinkRequest) =>
  request<ShareLink>(`/trees/${treeId}/share-links`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  deleteShareLink: (treeId: string, shareLinkId: string) =>
  request<string>(`/trees/${treeId}/share-links/${shareLinkId}`, {
    method: 'DELETE'
  }),

  sendInvitation: (treeId: string, data: InviteRequest) => {
    const emailError = validateField('invitation', 'email', data.email);
    const roleError = validateField('invitation', 'role', data.role);

    if (emailError) {
      showErrorToast(emailError);
      return Promise.reject(new Error(emailError));
    }

    if (roleError) {
      showErrorToast(roleError);
      return Promise.reject(new Error(roleError));
    }

    return request<string>(`/trees/${treeId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  acceptInvitation: (token: string) =>
  request<string>(`/invitations/accept?token=${token}`, { method: 'POST' }),

  viewSharedTree: (token: string) => request<Tree>(`/share?token=${token}`),

  viewSharedGraph: (token: string) =>
  request<TreeGraph>(`/share/graph?token=${token}`)
};