import React, { useEffect, useState } from 'react';
import {
  UsersIcon,
  UserPlusIcon,
  ShieldIcon,
  CrownIcon,
  PencilIcon,
  TrashIcon,
  LoaderIcon,
  XIcon,
  MailIcon,
  LinkIcon,
  CopyIcon,
  CheckIcon } from
'lucide-react';
import { treeService } from '../../services/treeService';
import { invitationService } from '../../services/invitationService';
import { showSuccessToast } from '../../utils/validation';
import { ConfirmationModal } from './ConfirmationModal';
import { ViewUserInfoPanel } from './ViewUserInfoPanel';
import type { TreeMember } from '../../types/tree';
import type { ShareLink } from '../../types/invitation';
import type { TreeRole } from '../../types/common';
interface MembersPanelProps {
  treeId: string;
  myRole: TreeRole;
  onClose: () => void;
}
export function MembersPanel({ treeId, myRole, onClose }: MembersPanelProps) {
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'links'>(
    'members'
  );
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TreeRole>('VIEWER');
  const [inviting, setInviting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersRes, linksRes] = await Promise.all([
        treeService.getMembers(treeId),
        canManage ?
        invitationService.getShareLinks(treeId) :
        Promise.resolve({
          success: true,
          data: []
        } as {
          success: boolean;
          data: ShareLink[];
        })]
        );
        if (membersRes.success) setMembers(membersRes.data);
        if (linksRes.success) setShareLinks(linksRes.data);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treeId, canManage]);
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    try {
      await invitationService.sendInvitation(treeId, {
        email: inviteEmail,
        role: inviteRole
      });
      showSuccessToast(`Đã gửi lời mời đến ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi lời mời thất bại');
    } finally {
      setInviting(false);
    }
  };
  const handleCreateShareLink = async () => {
    try {
      const res = await invitationService.createShareLink(treeId, {
        permission: 'VIEW',
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (res.success) {
        showSuccessToast('Tạo link chia sẻ thành công');
        setShareLinks((prev) => [...prev, res.data]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tạo link thất bại');
    }
  };
  const handleCopyLink = (link: ShareLink) => {
    navigator.clipboard.writeText(link.shareUrl);
    showSuccessToast('Đã sao chép link vào clipboard');
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi link chia sẻ này không?')) return;
    try {
      const res = await invitationService.deleteShareLink(treeId, linkId);
      if (res.success) {
        showSuccessToast('Thu hồi link chia sẻ thành công');
        setShareLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Thu hồi link thất bại');
    }
  };
  const handleRemoveMember = async (userId: string) => {
    setDeleting(true);
    try {
      await treeService.removeMember(treeId, userId);
      showSuccessToast('Xóa thành viên thành công');
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setShowDeleteConfirm(false);
      setDeletingUserId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa thành viên');
    } finally {
      setDeleting(false);
    }
  };
  const handleChangeRole = async (userId: string, newRole: TreeRole) => {
    try {
      await treeService.changeMemberRole(treeId, userId, newRole);
      showSuccessToast('Thay đổi vai trò thành công');
      setMembers((prev) =>
      prev.map((m) =>
      m.userId === userId ?
      {
        ...m,
        role: newRole
      } :
      m
      )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể thay đổi vai trò'
      );
    }
  };
  const roleIcons: Record<string, React.ReactNode> = {
    OWNER: <CrownIcon className="w-3.5 h-3.5 text-heritage-gold" />,
    ADMIN: <ShieldIcon className="w-3.5 h-3.5 text-heritage-red" />,
    EDITOR: <PencilIcon className="w-3.5 h-3.5 text-heritage-sage" />,
    VIEWER: <UsersIcon className="w-3.5 h-3.5 text-warm-400" />
  };
  const roleLabels: Record<string, string> = {
    OWNER: 'Chủ sở hữu',
    ADMIN: 'Quản trị',
    EDITOR: 'Biên tập',
    VIEWER: 'Xem'
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-warm-900/50 animate-fade-in"
        onClick={onClose} />
      
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h2 className="font-heading text-lg font-semibold text-warm-800">
            Thành viên
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
            
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-warm-100 px-5">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-heritage-gold text-heritage-gold' : 'border-transparent text-warm-400 hover:text-warm-600'}`}>
            
            Thành viên ({members.length})
          </button>
          {canManage &&
          <>
              <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invite' ? 'border-heritage-gold text-heritage-gold' : 'border-transparent text-warm-400 hover:text-warm-600'}`}>
              
                Mời
              </button>
              <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'links' ? 'border-heritage-gold text-heritage-gold' : 'border-transparent text-warm-400 hover:text-warm-600'}`}>
              
                Link chia sẻ
              </button>
            </>
          }
        </div>

        {error &&
        <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        }

        <div className="flex-1 overflow-y-auto p-5">
          {loading ?
          <div className="flex items-center justify-center py-12">
              <LoaderIcon className="w-6 h-6 text-heritage-gold animate-spin" />
            </div> :
          activeTab === 'members' ?
          <div className="space-y-2">
              {members.map((member) =>
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors">
              
                  <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                    {member.avatarUrl ?
                <img
                  src={member.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover" /> :


                <span className="text-sm font-semibold text-warm-500">
                        {(member.fullName ||
                  member.userName ||
                  '?')[0].toUpperCase()}
                      </span>
                }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {member.fullName || member.userName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {roleIcons[member.role]}
                      <span className="text-xs text-warm-400">
                        {roleLabels[member.role]}
                      </span>
                    </div>
                  </div>
                  {canManage && member.role !== 'OWNER' &&
              <div className="flex items-center gap-1">
                      <select
                  value={member.role}
                  onChange={(e) =>
                  handleChangeRole(
                    member.userId,
                    e.target.value as TreeRole
                  )
                  }
                  className="text-xs bg-warm-50 border border-warm-200 rounded-lg px-2 py-1.5 text-warm-600 focus:outline-none focus:ring-1 focus:ring-heritage-gold/30">
                  
                        <option value="VIEWER">Xem</option>
                        <option value="EDITOR">Biên tập</option>
                        <option value="ADMIN">Quản trị</option>
                      </select>
                      <button
                  onClick={() => setSelectedUserId(member.userId)}
                  className="p-1.5 rounded-lg text-warm-400 hover:text-heritage-gold hover:bg-warm-50 transition-colors"
                  title="Xem thông tin">
                  
                        <UsersIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                  onClick={() => {
                    setDeletingUserId(member.userId);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
              }
                </div>
            )}
            </div> :
          activeTab === 'invite' ?
          <div>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                    <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                    placeholder="email@example.com" />
                  
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Vai trò
                  </label>
                  <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TreeRole)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all">
                  
                    <option value="VIEWER">Xem</option>
                    <option value="EDITOR">Biên tập</option>
                    <option value="ADMIN">Quản trị</option>
                  </select>
                </div>
                <button
                type="submit"
                disabled={inviting}
                className="w-full py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                
                  {inviting ?
                <LoaderIcon className="w-4 h-4 animate-spin" /> :

                <UserPlusIcon className="w-4 h-4" />
                }
                  Gửi lời mời
                </button>
              </form>
            </div> :

          <div>
              <button
              onClick={handleCreateShareLink}
              className="w-full py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors flex items-center justify-center gap-2 mb-4">
              
                <LinkIcon className="w-4 h-4" />
                Tạo link chia sẻ mới
              </button>
              <div className="space-y-3">
                {shareLinks.map((link) =>
              <div
                key={link.id}
                className="p-3 bg-warm-50 rounded-xl border border-warm-100">
                
                    <div className="flex items-center justify-between mb-2">
                      <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-warm-200 text-warm-500'}`}>
                    
                        {link.isActive ? 'Hoạt động' : 'Hết hạn'}
                      </span>
                      <span className="text-xs text-warm-400">
                        {link.permission === 'VIEW' ? 'Chỉ xem' : 'Chỉnh sửa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-warm-500 truncate flex-1 font-mono">
                        {link.shareUrl}
                      </p>
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors flex-shrink-0"
                        title="Sao chép link">
                        {copiedId === link.id ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <CopyIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Thu hồi link">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {link.expiresAt &&
                <p className="text-xs text-warm-400 mt-1">
                        Hết hạn:{' '}
                        {new Date(link.expiresAt).toLocaleDateString('vi-VN')}
                      </p>
                }
                  </div>
              )}
                {shareLinks.length === 0 &&
              <p className="text-sm text-warm-400 text-center py-4">
                    Chưa có link chia sẻ nào
                  </p>
              }
              </div>
            </div>
          }
        </div>

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Xóa thành viên?"
          message="Thành viên này sẽ bị xóa khỏi cây gia phả. Hành động này không thể được hoàn tác."
          confirmText="Xóa"
          cancelText="Hủy"
          isDangerous
          isLoading={deleting}
          onConfirm={() => {
            if (deletingUserId) handleRemoveMember(deletingUserId);
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletingUserId(null);
          }}
        />

        {selectedUserId && (
          <ViewUserInfoPanel
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </div>
    </div>
  );
}