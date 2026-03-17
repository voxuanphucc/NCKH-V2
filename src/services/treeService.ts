import { request } from '../config/axios';
import type { Tree, CreateTreeRequest, TreeMember } from '../types/tree';
import type { TreeRole } from '../types/common';
import { validateField, showErrorToast } from '../utils/validation';

export const treeService = {
  getMyTrees: () => request<Tree[]>('/trees/my'),

  getTree: (treeId: string) => request<Tree>(`/trees/${treeId}`),

  createTree: (data: CreateTreeRequest) => {
    const nameError = validateField('tree', 'name', data.name);
    const descriptionError = validateField('tree', 'description', data.description);

    if (nameError) {
      showErrorToast(nameError);
      return Promise.reject(new Error(nameError));
    }

    if (descriptionError) {
      showErrorToast(descriptionError);
      return Promise.reject(new Error(descriptionError));
    }

    return request<Tree>('/trees', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTree: (treeId: string, data: CreateTreeRequest) => {
    const nameError = validateField('tree', 'name', data.name);
    const descriptionError = validateField('tree', 'description', data.description);

    if (nameError) {
      showErrorToast(nameError);
      return Promise.reject(new Error(nameError));
    }

    if (descriptionError) {
      showErrorToast(descriptionError);
      return Promise.reject(new Error(descriptionError));
    }

    return request<Tree>(`/trees/${treeId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTree: (treeId: string) =>
  request<string>(`/trees/${treeId}`, { method: 'DELETE' }),

  leaveTree: (treeId: string) =>
  request<string>(`/trees/${treeId}/leave`, { method: 'POST' }),

  getMembers: (treeId: string) =>
  request<TreeMember[]>(`/trees/${treeId}/members`),

  removeMember: (treeId: string, userId: string) =>
  request<string>(`/trees/${treeId}/members/${userId}`, { method: 'DELETE' }),

  changeMemberRole: (treeId: string, userId: string, role: TreeRole) =>
  request<string>(`/trees/${treeId}/members/${userId}/role?role=${role}`, {
    method: 'PATCH'
  })
};