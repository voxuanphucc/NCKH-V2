import { useState, useEffect } from 'react';
import {
  XIcon,
  Trash2Icon,
  PlusIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  LoaderIcon
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import { AddPersonToEventModal } from './AddPersonToEventModal';
import type { TreeEvent, EventParticipant } from '../../types/event';
import type { Address } from '../../types/address';

interface EventDetailPanelProps {
  treeId: string;
  event: TreeEvent;
  onClose: () => void;
  onRefresh: () => void;
}

export function EventDetailPanel({
  treeId,
  event,
  onClose,
  onRefresh
}: EventDetailPanelProps) {
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [eventDetail, setEventDetail] = useState<TreeEvent>(event);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await eventService.getEvent(treeId, event.id);
        if (res.success && res.data) {
          setEventDetail(res.data);
          setParticipants(res.data.participants || []);
          const firstAddr = (res.data.participants || []).find((p) => p.address)?.address;
          if (firstAddr) setAddress(firstAddr);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [treeId, event]);

  const handleRemoveParticipant = async (personId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa thành viên này khỏi sự kiện?')) {
      return;
    }
    
    try {
      setRemoving(personId);
      const res = await eventService.removePersonFromEvent(treeId, event.id, personId);
      if (res.success) {
        showSuccessToast('Xóa thành viên khỏi sự kiện thành công');
        setParticipants(participants.filter(p => p.person.id !== personId));
        onRefresh();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      showErrorToast('Không thể xóa thành viên khỏi sự kiện');
    } finally {
      setRemoving(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này khỏi gia phả không?')) {
      return;
    }
    try {
      setLoading(true);
      const res = await eventService.deleteEvent(treeId, event.id);
      if (res.success) {
        showSuccessToast('Đã xóa sự kiện thành công');
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showErrorToast('Không thể xóa sự kiện');
    } finally {
      if (!document.hidden) setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Chưa xác định';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = () => {
    if (!eventDetail.startedAt && !eventDetail.endedAt) return 'Chưa xác định';
    if (eventDetail.startedAt === eventDetail.endedAt) return formatDate(eventDetail.startedAt);
    return `${formatDate(eventDetail.startedAt)} - ${formatDate(eventDetail.endedAt)}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-warm-200">
        <div className="flex-1 pr-4">
          <h2 className="text-xl font-semibold text-warm-900">{eventDetail.name}</h2>
          <p className="text-sm text-warm-500 mt-1">{eventDetail.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteEvent}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Xóa sự kiện">
            <Trash2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors"
            title="Đóng">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarDaysIcon className="w-5 h-5 text-heritage-gold mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warm-600">Ngày tháng</p>
                <p className="text-warm-900 mt-1">{formatDateRange()}</p>
              </div>
            </div>

            {address && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-heritage-gold mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warm-600">Địa điểm</p>
                  <p className="text-warm-900 mt-1">
                    {address.addressLine && `${address.addressLine}, `}
                    {address.ward && `${address.ward}, `}
                    {address.district && `${address.district}, `}
                    {address.province}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Participants Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-heritage-gold" />
                <h3 className="font-semibold text-warm-900">
                  Thành viên tham gia ({participants.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAddParticipantModal(true)}
                className="p-1.5 rounded-lg text-heritage-gold hover:bg-heritage-gold/10 transition-colors flex items-center gap-1 text-sm font-medium"
                title="Thêm người tham gia">
                <PlusIcon className="w-4 h-4" />
                Thêm
              </button>
            </div>

            {participants.length === 0 ? (
              <p className="text-sm text-warm-500 py-4 text-center">
                Chưa có thành viên nào tham gia sự kiện này
              </p>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id || participant.person.id}
                    className="flex items-center justify-between p-3 bg-warm-50 rounded-lg hover:bg-warm-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-900 truncate">
                        {participant.person.fullName || participant.name}
                      </p>
                      <p className="text-xs text-warm-500 mt-1">
                        {participant.eventType && (
                          <>
                            <span className="inline-block px-2 py-0.5 bg-heritage-gold bg-opacity-20 text-heritage-gold rounded text-xs mr-2">
                              {participant.eventType}
                            </span>
                          </>
                        )}
                        {participant.roleInEvent && (
                          <span className="inline-block px-2 py-0.5 bg-warm-200 text-warm-700 rounded text-xs">
                            {participant.roleInEvent}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(participant.person.id)}
                      disabled={removing === participant.person.id}
                      className="p-2 ml-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      {removing === participant.person.id ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddPersonToEventModal
        isOpen={showAddParticipantModal}
        treeId={treeId}
        event={event}
        onClose={() => setShowAddParticipantModal(false)}
        onSuccess={() => {
          setShowAddParticipantModal(false);
          onRefresh();
        }}
      />
    </div>
  );
}
