import React, { useEffect, useRef, useState } from 'react';
import {
  XIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ImageIcon,
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  HeartIcon,
  LoaderIcon,
  SaveIcon,
  FileIcon,
  VideoIcon,
  UploadIcon,
  CameraIcon
} from 'lucide-react';
import { personService } from '../../services/personService';
import { familyService } from '../../services/familyService';
import { eventService } from '../../services/eventService';
import { addressService } from '../../services/addressService';
import { mediaService } from '../../services/mediaService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
import { ConfirmationModal } from './ConfirmationModal';
import { AddAddressModal } from './AddAddressModal';
import { AddEventModal } from './AddEventModal';
import type { Person } from '../../types/person';
import type { FamilyInfo, TreeGraph } from '../../types/family';
import type { TreeEvent } from '../../types/event';
import type { Address } from '../../types/address';
import type { MediaFile } from '../../types/media';
import type { Gender } from '../../types/common';
import { formatDate } from '../../utils/formatDate';
import { UploadMediaModal } from './UploadMediaModal';
import { formatBytes } from '@/utils/fomartBytes';
import { CreatePersonEventModal } from './CreatePersonEventModal';
interface PersonDetailPanelProps {
  personId: string;
  treeId: string;
  graph?: TreeGraph;
  onClose: () => void;
  onPersonClick: (personId: string) => void;
  onAddSpouse: (personId: string) => void;
  onAddParent: (personId: string) => void;
  onAddChild: (familyId: string) => void;
  onRefresh: () => void;
}

type Tab = 'info' | 'family' | 'events' | 'addresses' | 'media';

export function PersonDetailPanel({
  personId,
  treeId,
  graph,
  onClose,
  onPersonClick,
  onAddSpouse,
  onAddParent,
  onAddChild,
  onRefresh
}: PersonDetailPanelProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [events, setEvents] = useState<TreeEvent[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('MALE');
  const [editDob, setEditDob] = useState('');
  const [editDod, setEditDod] = useState('');

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAddressToEdit, setSelectedAddressToEdit] = useState<Address | undefined>();
  const [showDeleteAddressConfirm, setShowDeleteAddressConfirm] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  // Event modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<TreeEvent | undefined>();
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<TreeEvent | null>(null);

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showDeleteMediaConfirm, setShowDeleteMediaConfirm] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaFile | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<MediaFile | null>(null);


  //Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted || abortController.signal.aborted) return;
      setLoading(true);
      try {
        const [personRes, familyRes, eventsRes, addressesRes, mediaRes] =
          await Promise.all([
            personService.getPerson(personId).catch(() => ({ success: false, data: null })),
            familyService.getPersonFamily(treeId, personId).catch(() => ({ success: false, data: null })),
            eventService.getPersonEvents(treeId, personId).catch(() => ({ success: true, data: [] })),
            addressService.getPersonAddresses(treeId, personId).catch(() => ({ success: true, data: [] })),
            mediaService.getPersonMedia(treeId, personId).catch(() => ({ success: true, data: [] })),
          ]);

        if (!isMounted || abortController.signal.aborted) return;

        if (personRes.success && personRes.data) {
          setPerson(personRes.data);
          setEditFirstName(personRes.data.firstName);
          setEditLastName(personRes.data.lastName);
          setEditGender(personRes.data.gender);
          setEditDob(personRes.data.dateOfBirth ? personRes.data.dateOfBirth.split('T')[0] : '');
          setEditDod(personRes.data.dateOfDeath ? personRes.data.dateOfDeath.split('T')[0] : '');
        }
        if (familyRes.success && familyRes.data) setFamilyInfo(familyRes.data);
        if (eventsRes.success) setEvents(eventsRes.data as TreeEvent[]);
        if (addressesRes.success) setAddresses(addressesRes.data as Address[]);
        if (mediaRes.success) setMedia(mediaRes.data as MediaFile[]);
      } catch {
        // silent
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; abortController.abort(); };
  }, [personId, treeId]);
  const handleDeleteMedia = (file: MediaFile) => {
    setMediaToDelete(file);
    setShowDeleteMediaConfirm(true);
  };
  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    setDeletingMedia(true);
    try {
      const res = await mediaService.deleteMedia(treeId, mediaToDelete.id);
      if (res.success) {
        showSuccessToast('Xóa media thành công');
        setMedia(media.filter((m) => m.id !== mediaToDelete.id));
        setShowDeleteMediaConfirm(false);
        setMediaToDelete(null);
      } else {
        showErrorToast(res.message || 'Xóa media thất bại');
      }
    } catch {
      showErrorToast('Có lỗi khi xóa media');
    } finally {
      setDeletingMedia(false);
    }
  };
  // Thêm helper này
  function isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
  }

  function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url);
  }
  const handleMediaSuccess = (file: MediaFile) => {
    setMedia((prev) => [...prev, file]);
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const updateRes = await personService.updatePerson(personId, {
        firstName: editFirstName,
        lastName: editLastName,
        gender: editGender,
        dateOfBirth: editDob ? new Date(editDob).toISOString() : undefined,
        dateOfDeath: editDod ? new Date(editDod).toISOString() : undefined
      });
      if (updateRes.success) {
        const res = await personService.getPerson(personId);
        if (res.success) setPerson(res.data);
        showSuccessToast('Cập nhật thông tin thành công');
        setIsEditing(false);
        onRefresh();
      } else {
        showErrorToast(updateRes.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      showErrorToast('Có lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await personService.uploadAvatar(personId, file);
      if (res.success) {
        setPerson(res.data);
        showSuccessToast('Cập nhật ảnh đại diện thành công');
        onRefresh();
      } else {
        showErrorToast(res.message || 'Upload thất bại');
      }
    } catch {
      showErrorToast('Có lỗi khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Address handlers
  const handleAddAddress = () => { setAddressModalMode('create'); setSelectedAddressToEdit(undefined); setShowAddressModal(true); };
  const handleEditAddress = (address: Address) => { setAddressModalMode('edit'); setSelectedAddressToEdit(address); setShowAddressModal(true); };
  const handleDeleteAddress = (address: Address) => { setAddressToDelete(address); setShowDeleteAddressConfirm(true); };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setDeletingAddress(true);
    try {
      const res = await addressService.deletePersonAddress(treeId, personId, addressToDelete.id);
      if (res.success) {
        showSuccessToast('Xóa địa chỉ thành công');
        setAddresses(addresses.filter((a) => a.id !== addressToDelete.id));
        setShowDeleteAddressConfirm(false);
        setAddressToDelete(null);
      } else {
        showErrorToast(res.message || 'Xóa địa chỉ thất bại');
      }
    } catch {
      showErrorToast('Có lỗi khi xóa địa chỉ');
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleAddressSuccess = (address: Address) => {
    if (addressModalMode === 'create') {
      setAddresses([...addresses, address]);
    } else {
      setAddresses(addresses.map((a) => (a.id === address.id ? address : a)));
    }
  };

  // Event handlers
  const handleAddEvent = () => { setEventModalMode('create'); setSelectedEventToEdit(undefined); setShowEventModal(true); };
  const handleEditEvent = (event: TreeEvent) => { setEventModalMode('edit'); setSelectedEventToEdit(event); setShowEventModal(true); };
  const handleDeleteEvent = (event: TreeEvent) => { setEventToDelete(event); setShowDeleteEventConfirm(true); };

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeletingEvent(true);
    try {
      const res = await eventService.deleteEvent(treeId, eventToDelete.id);
      if (res.success) {
        showSuccessToast('Xóa sự kiện thành công');
        setEvents(events.filter((e) => e.id !== eventToDelete.id));
        setShowDeleteEventConfirm(false);
        setEventToDelete(null);
      } else {
        showErrorToast(res.message || 'Xóa sự kiện thất bại');
      }
    } catch {
      showErrorToast('Có lỗi khi xóa sự kiện');
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleEventSuccess = (event: TreeEvent) => {
    if (eventModalMode === 'create') {
      setEvents([...events, event]);
    } else {
      setEvents(events.map((e) => (e.id === event.id ? event : e)));
    }
  };

  // Delete person handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Bước 1: Kiểm tra
      const checkRes = await familyService.checkDeletable(treeId, personId);
      if (!checkRes.success) {
        showErrorToast('Có lỗi khi kiểm tra');
        return;
      }

      if (!checkRes.data.deletable) {
        showErrorToast(checkRes.data.message ?? 'Không thể xóa người này');
        setShowDeleteConfirm(false);
        return;
      }

      // Bước 2: Hard delete
      const res = await familyService.hardDeletePerson(treeId, personId);
      if (res.success) {
        showSuccessToast('Xóa thành viên thành công');
        setShowDeleteConfirm(false);
        onClose();
        await new Promise((r) => setTimeout(r, 500));
        onRefresh();
      } else {
        showErrorToast(res.message || 'Xóa thất bại');
      }
    } catch {
      showErrorToast('Có lỗi khi xóa thành viên');
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'info', label: 'Thông tin', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'family', label: 'Gia đình', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'events', label: 'Sự kiện', icon: <CalendarDaysIcon className="w-4 h-4" />, count: events.length },
    { id: 'addresses', label: 'Địa chỉ', icon: <MapPinIcon className="w-4 h-4" />, count: addresses.length },
    { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" />, count: media.length },
  ];

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-warm-200 flex items-center justify-center animate-slide-in-right">
        <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
      </div>
    );
  }

  if (!person) return null;

  const isMale = person.gender === 'MALE';
  const avatarUrl = person.avatarUrl || getDefaultAvatar(person.gender, person.dateOfBirth);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-warm-200 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="relative">
        <div className={`h-28 ${isMale ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gradient-to-br from-pink-100 to-pink-50'}`} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-warm-600 hover:bg-white transition-colors shadow-sm"
        >
          <XIcon className="w-4 h-4" />
        </button>
        <div className="px-6 -mt-20 flex justify-center">
          <div className="relative inline-block">
            <div className={`w-40 h-40 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center ${isMale ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
              {uploadingAvatar ? (
                <LoaderIcon className="w-8 h-8 animate-spin" />
              ) : (
                <img src={avatarUrl} alt="" className="w-40 h-40 rounded-2xl object-cover" />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-heritage-gold text-white flex items-center justify-center shadow-md hover:bg-heritage-gold/90 transition-colors disabled:opacity-60"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
        <div className="px-6 mt-3 pb-4">
          <h2 className="font-heading text-xl font-bold text-warm-800">
            {person.fullName || `${person.lastName} ${person.firstName}`}
          </h2>
          <p className="text-sm text-warm-400 mt-0.5">
            {isMale ? 'Nam' : 'Nữ'} · {person.dateOfDeath ? 'Đã mất' : 'Còn sống'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-100 px-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'border-heritage-gold text-heritage-gold'
              : 'border-transparent text-warm-400 hover:text-warm-600'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-warm-100 rounded-full text-[10px]">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Họ</label>
                    <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Tên</label>
                    <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-500 mb-1">Giới tính</label>
                  <select value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold">
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Ngày sinh</label>
                    <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">Ngày mất</label>
                    <input type="date" value={editDod} onChange={(e) => setEditDod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 bg-warm-100 text-warm-700 text-sm font-medium rounded-lg hover:bg-warm-200 transition-colors">Hủy</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 bg-warm-800 text-cream text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                    {saving ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                    Lưu
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                    <CalendarIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-warm-400">Ngày sinh</p>
                      <p className="text-sm font-medium text-warm-700">{formatDate(person.dateOfBirth)}</p>
                    </div>
                  </div>
                  {person.dateOfDeath && (
                    <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                      <HeartIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-warm-400">Ngày mất</p>
                        <p className="text-sm font-medium text-warm-700">{formatDate(person.dateOfDeath)}</p>
                      </div>
                    </div>
                  )}
                  {person.citizenIdentificationNumber && (
                    <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                      <UserIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-warm-400">CCCD/CMND</p>
                        <p className="text-sm font-medium text-warm-700">{person.citizenIdentificationNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(true)}
                    className="flex-1 py-2.5 bg-warm-100 text-warm-700 text-sm font-medium rounded-xl hover:bg-warm-200 transition-colors flex items-center justify-center gap-1.5">
                    <PencilIcon className="w-3.5 h-3.5" />Sửa
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={saving}
                    className="py-2.5 px-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* FAMILY TAB */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            {familyInfo ? (
              <>
                <div>
                  <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">Cha mẹ</h4>

                  {familyInfo.parentFamily && (
                    <div className="space-y-2 mb-2">
                      {familyInfo.parentFamily.parent1 && (
                        <button onClick={() => onPersonClick(familyInfo.parentFamily!.parent1.id)}
                          className="w-full flex items-center gap-3 p-3 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors text-left">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${familyInfo.parentFamily.parent1.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-800">{familyInfo.parentFamily.parent1.fullName}</p>
                            <p className="text-xs text-warm-400">{familyInfo.parentFamily.parent1.gender === 'MALE' ? 'Cha' : 'Mẹ'}</p>
                          </div>
                        </button>
                      )}
                      {familyInfo.parentFamily.parent2 && (
                        <button onClick={() => onPersonClick(familyInfo.parentFamily!.parent2!.id)}
                          className="w-full flex items-center gap-3 p-3 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors text-left">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${familyInfo.parentFamily.parent2.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-800">{familyInfo.parentFamily.parent2.fullName}</p>
                            <p className="text-xs text-warm-400">{familyInfo.parentFamily.parent2.gender === 'MALE' ? 'Cha' : 'Mẹ'}</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Chỉ ẩn nút khi đã có ĐỦ 2 cha mẹ */}
                  {(!familyInfo.parentFamily ||
                    !familyInfo.parentFamily.parent1 ||
                    !familyInfo.parentFamily.parent2) && (
                      <button onClick={() => onAddParent(personId)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-xl text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
                        <UserPlusIcon className="w-4 h-4" />Thêm cha/mẹ
                      </button>
                    )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">Vợ/Chồng</h4>
                  {familyInfo.spouseFamilies.length > 0 && (
                    <div className="space-y-3">
                      {familyInfo.spouseFamilies.map((sf) => {
                        const spouse = sf.parent1.id === personId ? sf.parent2 : sf.parent1;
                        return (
                          <div key={sf.id} className="bg-warm-50 rounded-xl p-3">
                            {/* Chỉ hiện spouse nếu có */}
                            {spouse ? (
                              <button onClick={() => onPersonClick(spouse.id)}
                                className="w-full flex items-center gap-3 text-left hover:bg-warm-100 rounded-lg p-1 -m-1 transition-colors">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${spouse.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                                  <UserIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-warm-800">{spouse.fullName}</p>
                                  <p className="text-xs text-warm-400">Kết hôn</p>
                                </div>
                              </button>
                            ) : (
                              <p className="text-xs text-warm-400 italic px-1">Chưa có vợ/chồng</p>
                            )}

                            {/* Con cái - luôn hiển thị */}
                            {sf.children.length > 0 && (
                              <div className={`${spouse ? 'mt-3 pt-3 border-t border-warm-100' : ''}`}>
                                <p className="text-xs text-warm-400 mb-2">Con ({sf.children.length})</p>
                                <div className="space-y-1.5">
                                  {sf.children.map((child) => (
                                    <button key={child.id} onClick={() => onPersonClick(child.id)}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-warm-100 transition-colors text-left">
                                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${child.gender === 'MALE' ? 'bg-blue-50 text-blue-400' : 'bg-pink-50 text-pink-400'}`}>
                                        <UserIcon className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-sm text-warm-700">{child.fullName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Nút thêm con - luôn hiển thị */}
                            <button onClick={() => onAddChild(sf.id)}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 border border-dashed border-warm-200 rounded-lg text-xs text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
                              <UserPlusIcon className="w-3.5 h-3.5" />Thêm con
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button onClick={() => onAddSpouse(personId)}
                    className="mt-3 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-xl text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
                    <HeartIcon className="w-4 h-4" />Thêm vợ/chồng
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có thông tin gia đình</p>
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có sự kiện nào</p>
                <button
                  onClick={handleAddEvent}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-heritage-gold text-white text-sm font-medium rounded-lg hover:bg-heritage-gold/90 transition-colors"
                >
                  <CalendarDaysIcon className="w-4 h-4" />
                  Thêm sự kiện
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 bg-warm-50 rounded-xl border border-warm-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Tên + badge */}
                        <h4 className="text-sm font-semibold text-warm-800 truncate">{event.name}</h4>
                        {event.description && (
                          <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">{event.description}</p>
                        )}

                        {/* Thời gian */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-warm-400">
                          {event.startedAt && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {formatDate(event.startedAt)}
                              {event.endedAt && event.endedAt !== event.startedAt && (
                                <> → {formatDate(event.endedAt)}</>
                              )}
                            </span>
                          )}
                          {event.participants?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <UsersIcon className="w-3 h-3" />
                              {event.participants.length} người tham gia
                            </span>
                          )}
                        </div>

                        {/* Participants preview */}
                        {event.participants?.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {event.participants.slice(0, 3).map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-warm-200 rounded-md text-[10px] text-warm-600"
                              >
                                <UserIcon className="w-2.5 h-2.5 text-warm-400" />
                                {p.person.fullName}
                              </span>
                            ))}
                            {event.participants.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-warm-100 rounded-md text-[10px] text-warm-500">
                                +{event.participants.length - 3} người khác
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {events.length > 0 && (
              <button
                onClick={handleAddEvent}
                className="mt-4 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-xl text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors"
              >
                <CalendarDaysIcon className="w-4 h-4" />
                Thêm sự kiện mới
              </button>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div>
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPinIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có địa chỉ nào</p>
                <button onClick={handleAddAddress}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-heritage-gold text-white text-sm font-medium rounded-lg hover:bg-heritage-gold/90 transition-colors">
                  <UserPlusIcon className="w-4 h-4" />Thêm địa chỉ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-warm-800">
                          {addr.formattedAddress || `${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                        </p>
                        {addr.addressType && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-warm-100 rounded-md text-xs text-warm-500">{addr.addressType}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleEditAddress(addr)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {addr.isPrimary && (
                      <div className="mt-2 flex items-center justify-end">
                        <span className="px-2 py-0.5 bg-heritage-gold/10 text-heritage-gold text-xs font-medium rounded-md">Chính</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {addresses.length > 0 && (
              <button onClick={handleAddAddress}
                className="mt-4 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-lg text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
                <UserPlusIcon className="w-4 h-4" />Thêm địa chỉ mới
              </button>
            )}
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="space-y-4">

            {/* Upload button luôn ở trên */}
            <button
              onClick={() => setShowMediaModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-heritage-gold text-white text-sm font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors"
            >
              <UploadIcon className="w-4 h-4" />
              Upload media
            </button>

            {/* Empty state */}
            {media.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có media nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {media.map((file) => {
                  const type = file.mediaFileType?.toUpperCase();

                  return (
                    <div
                      key={file.id}
                      className="group rounded-xl overflow-hidden bg-warm-50 border border-warm-100 hover:border-warm-200 transition-colors"
                    >
                      {/* PREVIEW */}
                      {type === 'IMAGE' ? (
                        <button onClick={() => setLightboxMedia(file)}>
                          <div className="w-full aspect-square bg-warm-100">
                            <img
                              src={file.fileUrl}
                              alt={file.fileName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </button>
                      ) : type === 'VIDEO' ? (
                        <div className="w-full aspect-square flex items-center justify-center bg-purple-50">
                          <VideoIcon className="w-8 h-8 text-purple-300" />
                        </div>
                      ) : (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full aspect-square flex items-center justify-center bg-warm-100 hover:bg-warm-200 transition-colors"
                        >
                          <FileIcon className="w-8 h-8 text-warm-300" />
                        </a>
                      )}

                      {/* INFO */}
                      <div className="p-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-warm-700 font-medium truncate">
                              {file.fileName}
                            </p>
                            <p className="text-[10px] text-warm-400 mt-0.5">
                              {file.mediaFileTypeDescription}
                              {file.fileSize ? ` · ${formatBytes(file.fileSize)}` : ''}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteMedia(file)}
                            className="p-1 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>

                        {file.description && (
                          <p className="text-[10px] text-warm-400 mt-1 line-clamp-1 italic">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Xóa người này?"
        message="Bên dưới sẽ xóa tất cả thông tin về người này khỏi cây gia phả. Hành động này không thể được hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showDeleteAddressConfirm}
        title="Xóa địa chỉ này?"
        message={`${addressToDelete?.formattedAddress || 'Địa chỉ này'} sẽ bị xóa vĩnh viễn.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={deletingAddress}
        onConfirm={handleConfirmDeleteAddress}
        onCancel={() => setShowDeleteAddressConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showDeleteEventConfirm}
        title="Xóa sự kiện này?"
        message={`Sự kiện "${eventToDelete?.name || ''}" sẽ bị xóa vĩnh viễn.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={deletingEvent}
        onConfirm={handleConfirmDeleteEvent}
        onCancel={() => setShowDeleteEventConfirm(false)}
      />

      <AddAddressModal
        isOpen={showAddressModal}
        mode={addressModalMode}
        address={selectedAddressToEdit}
        treeId={treeId}
        personId={personId}
        onClose={() => setShowAddressModal(false)}
        onSuccess={handleAddressSuccess}
      />

      <CreatePersonEventModal
        isOpen={showEventModal}
        mode={eventModalMode}
        event={selectedEventToEdit}
        treeId={treeId}
        personId={personId} // ✅ đổi tên ở đây
        onClose={() => setShowEventModal(false)}
        onSuccess={handleEventSuccess}
      />

      <ConfirmationModal
        isOpen={showDeleteMediaConfirm}
        title="Xóa file này?"
        message={`"${mediaToDelete?.fileName}" sẽ bị xóa vĩnh viễn.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={deletingMedia}
        onConfirm={handleConfirmDeleteMedia}
        onCancel={() => setShowDeleteMediaConfirm(false)}
      />

      <UploadMediaModal
        isOpen={showMediaModal}
        treeId={treeId}
        personId={personId}
        onClose={() => setShowMediaModal(false)}
        onSuccess={handleMediaSuccess}
      />

      {/* Lightbox */}
      {lightboxMedia && isImageUrl(lightboxMedia.fileUrl) && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxMedia(null)}
          >
            <XIcon className="w-5 h-5" />
          </button>

          <img
            src={lightboxMedia.fileUrl}
            alt={lightboxMedia.fileName}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white/80 text-sm">{lightboxMedia.fileName}</p>
            {lightboxMedia.description && (
              <p className="text-white/50 text-xs mt-1">
                {lightboxMedia.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}