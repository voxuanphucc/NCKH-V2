import { useState } from 'react';
import {
  XIcon,
  AlertTriangleIcon,
  LoaderIcon
} from 'lucide-react';
import { familyService } from '../../services/familyService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';

interface DeleteFamilyModalProps {
  treeId: string;
  familyId: string;
  person1Name: string;
  person2Name: string;
  relationshipType: 'SPOUSE' | 'PARENT' | 'CHILD';
  personIdToRemove? : string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteFamilyModal({
  treeId,
  familyId,
  person1Name,
  person2Name,
  relationshipType,
  personIdToRemove,
  onClose,
  onSuccess
}: DeleteFamilyModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const getRelationshipLabel = () => {
    switch (relationshipType) {
      case 'SPOUSE':
        return 'vợ/chồng';
      case 'PARENT':
        return 'cha/mẹ';
      case 'CHILD':
        return 'con';
      default:
        return 'thành viên gia đình';
    }
  };

  const getDeleteMessage = () => {
    if (personIdToRemove) {
      return `Bạn sắp xóa ${person2Name} khỏi mối quan hệ. Điều này sẽ hủy bỏ mối liên kết gia đình.`;
    }
    return `Bạn sắp xóa mối quan hệ giữa ${person1Name} và ${person2Name}. Điều này sẽ hủy bỏ mối liên kết gia đình giữa hai người này.`;
  };

  const handleDelete = async () => {
    if (confirmText !== 'XÓA') {
      showErrorToast('Vui lòng nhập "XÓA" để xác nhận');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (personIdToRemove) {
        // Remove specific person from family
        res = await familyService.removeChild(treeId, familyId, personIdToRemove);
      } else {
        // Delete entire family relationship
        res = await familyService.deleteFamily(treeId, familyId);
      }

      if (res.success) {
        showSuccessToast('Xóa mối quan hệ gia đình thành công');
        onSuccess();
        onClose();
      } else {
        showErrorToast(res.message || 'Không thể xóa mối quan hệ');
      }
    } catch (error) {
      console.error('Error deleting family:', error);
      showErrorToast('Có lỗi xảy ra khi xóa mối quan hệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-warm-900">Xóa mối quan hệ</h2>
              <p className="text-sm text-warm-500 mt-1">Hành động này không thể hoàn tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-warm-100 rounded-lg transition-colors disabled:opacity-50">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {getDeleteMessage()}
          </p>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-warm-600">Người 1:</span>
            <span className="font-medium text-warm-900">{person1Name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">Mối quan hệ:</span>
            <span className="font-medium text-warm-900">{getRelationshipLabel()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-600">Người 2:</span>
            <span className="font-medium text-warm-900">{person2Name}</span>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-warm-700 mb-2">
            Nhập "XÓA" để xác nhận
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="XÓA"
            disabled={loading}
            className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heritage-gold focus:border-transparent disabled:bg-warm-100"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-warm-100 text-warm-700 rounded-lg font-medium hover:bg-warm-200 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== 'XÓA'}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              'Xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
