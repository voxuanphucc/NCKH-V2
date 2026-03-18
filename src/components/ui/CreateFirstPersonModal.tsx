import React, { useState } from 'react';
import { XIcon, LoaderIcon, UserPlusIcon } from 'lucide-react';
import { familyService } from '../../services/familyService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { Person } from '../../types/person';
import type { Gender } from '../../types/common';

interface CreateFirstPersonModalProps {
  isOpen: boolean;
  treeId: string;
  onClose: () => void;
  onSuccess: (person: Person) => void;
}

export function CreateFirstPersonModal({
  isOpen,
  treeId,
  onClose,
  onSuccess
}: CreateFirstPersonModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Tên là bắt buộc';
    if (!lastName.trim()) newErrors.lastName = 'Họ là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await familyService.createFirstPerson(treeId, {
        firstName,
        lastName,
        gender,
        dateOfBirth: dateOfBirth || undefined
      });

      if (res.success) {
        showSuccessToast('Tạo thành viên gốc thành công');
        onSuccess(res.data);
        handleClose();
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể tạo thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setGender('MALE');
    setDateOfBirth('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-warm-900/50 animate-fade-in"
        onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-warm-800">
                Tạo người gốc
              </h2>
              <p className="text-xs text-warm-400">Bắt đầu cây gia phả từ một người</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Họ
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors((prev) => ({ ...prev, lastName: '' }));
                }}
                placeholder="VD: Nguyễn"
                className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                  errors.lastName ? 'border-red-300' : 'border-warm-200'
                }`} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Tên
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors((prev) => ({ ...prev, firstName: '' }));
                }}
                placeholder="VD: Văn A"
                className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                  errors.firstName ? 'border-red-300' : 'border-warm-200'
                }`} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Giới tính
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  gender === 'MALE'
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-warm-200 text-warm-500 hover:border-warm-300'
                }`}>
                👨 Nam
              </button>
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  gender === 'FEMALE'
                    ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-warm-200 text-warm-500 hover:border-warm-300'
                }`}>
                👩 Nữ
              </button>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Ngày sinh (tùy chọn)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
          </div>

          {/* Info */}
          <div className="bg-heritage-gold/5 rounded-xl p-3 border border-heritage-gold/10">
            <p className="text-xs text-warm-600">
              💡 Đây sẽ là người gốc của cây gia phả. Sau đó, bạn có thể thêm cha/mẹ, vợ/chồng và con.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
              Tạo người
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
