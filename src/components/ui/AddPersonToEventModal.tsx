import React, { useState, useEffect } from 'react';
import { XIcon, LoaderIcon, UserPlusIcon } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { treeService } from '../../services/treeService';
import { lookupService } from '../../services/lookupService';
import { addressService } from '../../services/addressService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { TreeEvent } from '../../types/event';
import type { Person } from '../../types/person';
import type { LookupItem } from '../../types/common';
import type { Address } from '../../types/address';

interface AddPersonToEventModalProps {
  isOpen: boolean;
  treeId: string;
  event: TreeEvent;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPersonToEventModal({
  isOpen,
  treeId,
  event,
  onClose,
  onSuccess
}: AddPersonToEventModalProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [eventTypes, setEventTypes] = useState<LookupItem[]>([]);
  const [treeAddresses, setTreeAddresses] = useState<Address[]>([]);

  const [personId, setPersonId] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [roleInEventId, setRoleInEventId] = useState('');
  const [addressId, setAddressId] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      resetForm();
    }
  }, [isOpen, treeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [graphRes, typesRes, addressesRes] = await Promise.all([
        treeService.getGraph(treeId),
        lookupService.getEventTypes(),
        addressService.getTreeAddresses(treeId).catch(() => ({ success: true, data: [] as Address[] }))
      ]);

      if (graphRes.success && graphRes.data) {
        setPersons(graphRes.data.persons || []);
      }
      if (typesRes.success) setEventTypes(typesRes.data);
      if (addressesRes.success) setTreeAddresses(addressesRes.data as Address[]);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu cho form:', error);
      showErrorToast('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPersonId('');
    setEventTypeId('');
    setRoleInEventId('');
    setAddressId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !eventTypeId) {
      showErrorToast('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const personName = persons.find(p => p.id === personId)?.fullName || 'Thành viên';
      const res = await eventService.addPersonToEvent(treeId, event.id, {
        personId,
        eventTypeId,
        roleInEventId,
        addressId: addressId || undefined,
        name: personName,
      });

      if (res.success) {
        showSuccessToast('Đã thêm thành viên vào sự kiện');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi thêm người vào sự kiện:', error);
      showErrorToast('Không thể thêm thành viên vào sự kiện này');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-warm-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-heritage-gold/10 rounded-lg text-heritage-gold">
              <UserPlusIcon className="w-5 h-5" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-warm-800">
              Thêm người tham gia
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
            </div>
          ) : (
            <form id="add-participant-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Thành viên tham gia *
                </label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30">
                  <option value="">-- Chọn thành viên --</option>
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || `${p.lastName} ${p.firstName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Loại sự kiện *
                </label>
                <select
                  value={eventTypeId}
                  onChange={(e) => setEventTypeId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30">
                  <option value="">-- Chọn loại --</option>
                  {eventTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.description}
                    </option>
                  ))}
                </select>
              </div>



              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Địa điểm (tuỳ chọn)
                </label>
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30">
                  <option value="">-- Không chọn --</option>
                  {treeAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.formattedAddress || a.addressLine}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          )}
        </div>

        <div className="p-5 border-t border-warm-100 flex justify-end gap-3 bg-warm-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-warm-600 font-medium hover:bg-warm-100 rounded-xl transition-colors">
            Hủy
          </button>
          <button
            type="submit"
            form="add-participant-form"
            disabled={loading || submitting}
            className="px-5 py-2.5 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            {submitting ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <UserPlusIcon className="w-4 h-4" />}
            Thêm thành viên
          </button>
        </div>
      </div>
    </div>
  );
}
