import React, { useState } from 'react';
import { XIcon, LoaderIcon, SettingsIcon, LogOutIcon } from 'lucide-react';
import { treeService } from '../../services/treeService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import { ConfirmationModal } from './ConfirmationModal';
import type { Tree } from '../../types/tree';

interface TreeSettingsModalProps {
  isOpen: boolean;
  tree: Tree;
  onClose: () => void;
  onUpdate: (updatedTree: Tree) => void;
  onLeave: () => void;
}

export function TreeSettingsModal({
  isOpen,
  tree,
  onClose,
  onUpdate,
  onLeave
}: TreeSettingsModalProps) {
  const [treeName, setTreeName] = useState(tree.name);
  const [treeDesc, setTreeDesc] = useState(tree.description || '');
  const [saving, setSaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!treeName.trim()) newErrors.treeName = 'Tên cây gia phả là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const res = await treeService.updateTree(tree.id, {
        name: treeName,
        description: treeDesc
      });
      if (res.success) {
        showSuccessToast('Cập nhật cây gia phả thành công');
        onUpdate(res.data);
        onClose();
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể cập nhật cây gia phả');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveTree = async () => {
    setLeaving(true);
    try {
      await treeService.leaveTree(tree.id);
      showSuccessToast('Rời cây gia phả thành công');
      onLeave();
      onClose();
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể rời cây gia phả');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-warm-900/50 animate-fade-in"
          onClick={onClose} />

        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-heritage-gold" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-warm-800">
                  Cài đặt cây
                </h2>
                <p className="text-xs text-warm-400">Quản lý thông tin cây gia phả</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Edit Tree Info */}
            <form onSubmit={handleSave} className="space-y-5">
              {/* Tree Name */}
              <div>
                <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                  Tên cây
                </label>
                <input
                  type="text"
                  value={treeName}
                  onChange={(e) => {
                    setTreeName(e.target.value);
                    setErrors((prev) => ({ ...prev, treeName: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                    errors.treeName ? 'border-red-300' : 'border-warm-200'
                  }`} />
                {errors.treeName && <p className="text-xs text-red-500 mt-1">{errors.treeName}</p>}
              </div>

              {/* Tree Description */}
              <div>
                <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                  Mô tả
                </label>
                <textarea
                  value={treeDesc}
                  onChange={(e) => setTreeDesc(e.target.value)}
                  placeholder="Mô tả chi tiết về cây gia phả này..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none" />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SettingsIcon className="w-4 h-4" />}
                Cập nhật thông tin
              </button>
            </form>

            {/* Divider */}
            <div className="border-t border-warm-100" />

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="text-sm font-semibold text-red-700 mb-2">⚠️ Vùng nguy hiểm</h3>
              <p className="text-xs text-red-600 mb-3">
                Rời khỏi cây gia phả này. Bạn sẽ không còn quyền truy cập nữa.
              </p>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full py-3 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
                <LogOutIcon className="w-4 h-4" />
                Rời khỏi cây gia phả
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-700">
                💡 Chỉ OWNER mới có thể xóa tree. Để xóa, hãy liên hệ chủ sở hữu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi cây gia phả?"
        message={`Bạn sắp rời khỏi "${tree.name}". Hành động này không thể được hoàn tác.`}
        confirmText="Rời khỏi"
        cancelText="Hủy"
        isDangerous
        isLoading={leaving}
        onConfirm={handleLeaveTree}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </>
  );
}
