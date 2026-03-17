import type { SharePermission, TreeRole } from './common';

export interface ShareLink {
  id: string;
  shareUrl: string;
  permission: SharePermission;
  expiresAt: string;
  isActive: boolean;
}

export interface CreateShareLinkRequest {
  permission: SharePermission;
  expiredAt: string;
}

export interface InviteRequest {
  email: string;
  role: TreeRole;
}