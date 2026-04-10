import React, { useState } from 'react';
import { XIcon, LoaderIcon, UserPlusIcon } from 'lucide-react';
import type { Gender } from '../../types/common';
type ModalMode = 'first' | 'spouse' | 'parent' | 'child';
interface AddPersonModalProps {
  mode: ModalMode;
  onClose: () => void;
  onSubmit: (data: PersonFormData) => Promise<void>;
  loading: boolean;
  targetPersonName?: string;
}
export interface PersonFormData {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  dateOfDeath?: string;
  citizenIdentificationNumber?: string;
  avatarUrl?: string;
  fromDate?: string;
  toDate?: string;
}
const modeLabels: Record<ModalMode, string> = {
  first: 'Thêm người đầu tiên',
  spouse: 'Thêm vợ/chồng',
  parent: 'Thêm cha/mẹ',
  child: 'Thêm con'
};
const modeDescriptions: Record<ModalMode, string> = {
  first: 'Tạo người gốc của cây gia phả',
  spouse: 'Thêm vợ/chồng cho thành viên',
  parent: 'Thêm cha hoặc mẹ cho thành viên',
  child: 'Thêm con vào gia đình'
};
export function AddPersonModal({
  mode,
  onClose,
  onSubmit,
  loading,
  targetPersonName
}: AddPersonModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [error, setError] = useState('');
  const showUnionFields = mode === 'spouse' || mode === 'parent';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Vui lòng nhập đầy đủ họ và tên');
      return;
    }
    const data: PersonFormData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      dateOfBirth: dateOfBirth ?
        new Date(dateOfBirth).toISOString() :
        undefined,
      dateOfDeath: dateOfDeath ?
        new Date(dateOfDeath).toISOString() :
        undefined,
      citizenIdentificationNumber: citizenId || undefined
    };
    if (showUnionFields) {
      data.fromDate = fromDate || undefined;
    }
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-warm-900/50 animate-fade-in"
        onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
          <div>
            <h2 className="font-heading text-xl font-semibold text-warm-800 flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-heritage-gold" />
              {modeLabels[mode]}
            </h2>
            <p className="text-sm text-warm-400 mt-0.5">
              {targetPersonName ?
                `${modeDescriptions[mode]} — ${targetPersonName}` :
                modeDescriptions[mode]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">

            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error &&
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          }

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Họ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="Nguyễn" />

            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="Văn A" />

            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Giới tính
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${gender === 'MALE' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-warm-200 text-warm-500 hover:border-warm-300'}`}>

                👨 Nam
              </button>
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${gender === 'FEMALE' ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-warm-200 text-warm-500 hover:border-warm-300'}`}>

                👩 Nữ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Ngày sinh
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />

            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Ngày mất
              </label>
              <input
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />

            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Số CCCD/CMND
            </label>
            <input
              type="text"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
              placeholder="Không bắt buộc" />

          </div>

          {showUnionFields &&
            <>
              <div className="pt-2 border-t border-warm-100">
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Quan hệ hôn nhân
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Ngày kết hôn
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />

              </div>
            </>
          }

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors">

              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">

              {loading && <LoaderIcon className="w-4 h-4 animate-spin" />}
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>);

}