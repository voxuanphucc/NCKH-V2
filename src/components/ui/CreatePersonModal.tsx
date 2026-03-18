import React, { useState } from 'react';
import { XIcon, LoaderIcon, UserPlusIcon } from 'lucide-react';
import type { Gender } from '../../types/common';
import type { CreatePersonRequest, Person } from '../../types/person';
import { personService } from '../../services/personService';
import { showErrorToast, showSuccessToast } from '../../utils/validation';

interface CreatePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (person: Person) => void;
}

export function CreatePersonModal({ isOpen, onClose, onCreated }: CreatePersonModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (submitting) return;
    setFirstName('');
    setLastName('');
    setGender('MALE');
    setDateOfBirth('');
    setDateOfDeath('');
    setCitizenId('');
    setAvatarUrl('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreatePersonRequest = {
        firstName,
        lastName,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        dateOfDeath: dateOfDeath || undefined,
        citizenIdentificationNumber: citizenId || undefined,
        avatarUrl: avatarUrl || undefined
      };
      const res = await personService.createPerson(payload);
      if (res.success) {
        showSuccessToast('Tạo person thành công');
        onCreated(res.data);
        handleClose();
      } else {
        showErrorToast(res.message || 'Không thể tạo person');
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể tạo person');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-warm-900/50 animate-fade-in" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-warm-800">
                Tạo person (hệ thống)
              </h2>
              <p className="text-xs text-warm-400">Tạo mới theo `POST /api/v1/persons`</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Họ *
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
                placeholder="Nguyễn"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Tên *
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
                placeholder="Văn A"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Giới tính *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                CCCD/CMND
              </label>
              <input
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
                placeholder="0123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Ngày mất
              </label>
              <input
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Avatar URL
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

