import { useState } from 'react';
import {
  XIcon,
  LoaderIcon,
  CalendarDaysIcon
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { TreeEvent } from '../../types/event';

interface AddEventModalProps {
  isOpen: boolean;
  treeId: string;
  mode: 'create' | 'edit';
  event?: TreeEvent;
  onClose: () => void;
  onSuccess: (event: TreeEvent) => void;
}

export function AddEventModal({
  isOpen,
  treeId,
  mode,
  event,
  onClose,
  onSuccess
}: AddEventModalProps) {
  const [eventName, setEventName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startedAt, setStartedAt] = useState(
    event?.startedAt ? new Date(event.startedAt).toISOString().split('T')[0] : ''
  );
  const [endedAt, setEndedAt] = useState(
    event?.endedAt ? new Date(event.endedAt).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!eventName.trim()) newErrors.eventName = 'Tên sự kiện là bắt buộc';
    if (!startedAt) newErrors.startedAt = 'Ngày bắt đầu là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const startDate = new Date(startedAt);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = endedAt ? new Date(endedAt) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      const eventData = {
        event: {
          name: eventName,
          description: description,
          startedAt: startDate.toISOString(),
          endedAt: endDate?.toISOString()
        },
        treeEvent: {
          addressId: undefined,
          name: eventName
        }
      };

      const res = mode === 'edit' && event
        ? await eventService.updateEvent(treeId, event.id, eventData)
        : await eventService.createEvent(treeId, eventData);
      if (res.success) {
        showSuccessToast(mode === 'create' ? 'Tạo sự kiện thành công' : 'Cập nhật sự kiện thành công');
        onSuccess(res.data);
        handleClose();
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể lưu sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEventName('');
    setDescription('');
    setStartedAt('');
    setEndedAt('');
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
              <CalendarDaysIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-warm-800">
                {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật sự kiện'}
              </h2>
              <p className="text-xs text-warm-400">Quản lý sự kiện trong cây gia phả</p>
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
          {/* Event Name */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Tên sự kiện
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="VD: Lễ cưới, sinh nhật, ..."
              className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                errors.eventName ? 'border-red-300' : 'border-warm-200'
              }`} />
            {errors.eventName && <p className="text-xs text-red-500 mt-1">{errors.eventName}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết về sự kiện này..."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                  errors.startedAt ? 'border-red-300' : 'border-warm-200'
                }`} />
              {errors.startedAt && <p className="text-xs text-red-500 mt-1">{errors.startedAt}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            </div>
          </div>

          {/* Info */}
          <div className="bg-heritage-gold/5 rounded-xl p-3 border border-heritage-gold/10">
            <p className="text-xs text-warm-600">
              💡 Sau khi tạo sự kiện, bạn có thể thêm các thành viên tham gia từ tab sự kiện.
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
              {loading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <CalendarDaysIcon className="w-4 h-4" />}
              {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
