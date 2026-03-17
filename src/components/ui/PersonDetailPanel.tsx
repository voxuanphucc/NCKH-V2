import React, { useEffect, useState, Children } from 'react';
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
  SaveIcon } from
'lucide-react';
import { personService } from '../../services/personService';
import { familyService } from '../../services/familyService';
import { eventService } from '../../services/eventService';
import { addressService } from '../../services/addressService';
import { mediaService } from '../../services/mediaService';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
import type { Person } from '../../types/person';
import type { FamilyInfo } from '../../types/family';
import type { TreeEvent } from '../../types/event';
import type { Address } from '../../types/address';
import type { MediaFile } from '../../types/media';
import type { Gender } from '../../types/common';
import { formatDate } from '../../utils/formatDate';
interface PersonDetailPanelProps {
  personId: string;
  treeId: string;
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
  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('MALE');
  const [editDob, setEditDob] = useState('');
  const [editDod, setEditDod] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [personRes, familyRes, eventsRes, addressRes, mediaRes] =
        await Promise.all([
        personService.getPerson(personId),
        familyService.getPersonFamily(treeId, personId),
        eventService.getPersonEvents(treeId, personId).catch(() => ({
          success: true,
          data: []
        })),
        addressService.getPersonAddresses(treeId, personId).catch(() => ({
          success: true,
          data: []
        })),
        mediaService.getPersonMedia(treeId, personId).catch(() => ({
          success: true,
          data: []
        }))]
        );
        if (personRes.success) {
          setPerson(personRes.data);
          setEditFirstName(personRes.data.firstName);
          setEditLastName(personRes.data.lastName);
          setEditGender(personRes.data.gender);
          setEditDob(
            personRes.data.dateOfBirth ?
            personRes.data.dateOfBirth.split('T')[0] :
            ''
          );
          setEditDod(
            personRes.data.dateOfDeath ?
            personRes.data.dateOfDeath.split('T')[0] :
            ''
          );
        }
        if (familyRes.success) setFamilyInfo(familyRes.data);
        if (eventsRes.success) setEvents(eventsRes.data as TreeEvent[]);
        if (addressRes.success) setAddresses(addressRes.data as Address[]);
        if (mediaRes.success) setMedia(mediaRes.data as MediaFile[]);
      } catch {

        // Handle error silently
      } finally {setLoading(false);
      }
    };
    fetchData();
  }, [personId, treeId]);
  const handleSave = async () => {
    setSaving(true);
    try {
      await personService.updatePerson(personId, {
        firstName: editFirstName,
        lastName: editLastName,
        gender: editGender,
        dateOfBirth: editDob ? new Date(editDob).toISOString() : undefined,
        dateOfDeath: editDod ? new Date(editDod).toISOString() : undefined
      });
      const res = await personService.getPerson(personId);
      if (res.success) setPerson(res.data);
      setIsEditing(false);
      onRefresh();
    } catch {

      // Handle error
    } finally {setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa người này?')) return;
    try {
      await personService.deletePerson(personId);
      onClose();
      onRefresh();
    } catch {

      // Handle error
    }};
  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
  {
    id: 'info',
    label: 'Thông tin',
    icon: <UserIcon className="w-4 h-4" />
  },
  {
    id: 'family',
    label: 'Gia đình',
    icon: <UsersIcon className="w-4 h-4" />
  },
  {
    id: 'events',
    label: 'Sự kiện',
    icon: <CalendarDaysIcon className="w-4 h-4" />,
    count: events.length
  },
  {
    id: 'addresses',
    label: 'Địa chỉ',
    icon: <MapPinIcon className="w-4 h-4" />,
    count: addresses.length
  },
  {
    id: 'media',
    label: 'Media',
    icon: <ImageIcon className="w-4 h-4" />,
    count: media.length
  }];

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-warm-200 flex items-center justify-center animate-slide-in-right">
        <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
      </div>);

  }
  if (!person) return null;
  const isMale = person.gender === 'MALE';
  const avatarUrl = person.avatarUrl || getDefaultAvatar(person.gender, person.dateOfBirth);
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-warm-200 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="relative">
        <div
          className={`h-28 ${isMale ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gradient-to-br from-pink-100 to-pink-50'}`} />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-warm-600 hover:bg-white transition-colors shadow-sm">
          
          <XIcon className="w-4 h-4" />
        </button>

        <div className="px-6 -mt-10">
          <div
            className={`
            w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center
            ${isMale ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}
          `}>
            
            <img
              src={avatarUrl}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover" />
          </div>
        </div>

        <div className="px-6 mt-3 pb-4">
          <h2 className="font-heading text-xl font-bold text-warm-800">
            {person.fullName || `${person.lastName} ${person.firstName}`}
          </h2>
          <p className="text-sm text-warm-400 mt-0.5">
            {isMale ? 'Nam' : 'Nữ'} ·{' '}
            {person.dateOfDeath ? 'Đã mất' : 'Còn sống'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-100 px-4 overflow-x-auto">
        {tabs.map((tab) =>
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-heritage-gold text-heritage-gold' : 'border-transparent text-warm-400 hover:text-warm-600'}`}>
          
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 &&
          <span className="ml-1 px-1.5 py-0.5 bg-warm-100 rounded-full text-[10px]">
                {tab.count}
              </span>
          }
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'info' &&
        <div className="space-y-5">
            {isEditing ?
          <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Họ
                    </label>
                    <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Tên
                    </label>
                    <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-500 mb-1">
                    Giới tính
                  </label>
                  <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold">
                
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Ngày sinh
                    </label>
                    <input
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Ngày mất
                    </label>
                    <input
                  type="date"
                  value={editDod}
                  onChange={(e) => setEditDod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold" />
                
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 bg-warm-100 text-warm-700 text-sm font-medium rounded-lg hover:bg-warm-200 transition-colors">
                
                    Hủy
                  </button>
                  <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-warm-800 text-cream text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
                
                    {saving ?
                <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> :

                <SaveIcon className="w-3.5 h-3.5" />
                }
                    Lưu
                  </button>
                </div>
              </> :

          <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                    <CalendarIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-warm-400">Ngày sinh</p>
                      <p className="text-sm font-medium text-warm-700">
                        {formatDate(person.dateOfBirth)}
                      </p>
                    </div>
                  </div>
                  {person.dateOfDeath &&
              <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                      <HeartIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-warm-400">Ngày mất</p>
                        <p className="text-sm font-medium text-warm-700">
                          {formatDate(person.dateOfDeath)}
                        </p>
                      </div>
                    </div>
              }
                  {person.citizenIdentificationNumber &&
              <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                      <UserIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-warm-400">CCCD/CMND</p>
                        <p className="text-sm font-medium text-warm-700">
                          {person.citizenIdentificationNumber}
                        </p>
                      </div>
                    </div>
              }
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 bg-warm-100 text-warm-700 text-sm font-medium rounded-xl hover:bg-warm-200 transition-colors flex items-center justify-center gap-1.5">
                
                    <PencilIcon className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                onClick={handleDelete}
                className="py-2.5 px-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
          }
          </div>
        }

        {activeTab === 'family' && familyInfo &&
        <div className="space-y-6">
            {/* Parents */}
            <div>
              <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
                Cha mẹ
              </h4>
              {familyInfo.parentFamily ?
            <div className="space-y-2">
                  {familyInfo.parentFamily.parent1 &&
              <button
                onClick={() =>
                onPersonClick(familyInfo.parentFamily!.parent1.id)
                }
                className="w-full flex items-center gap-3 p-3 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors text-left">
                
                      <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${familyInfo.parentFamily.parent1.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                  
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warm-800">
                          {familyInfo.parentFamily.parent1.fullName}
                        </p>
                        <p className="text-xs text-warm-400">
                          {familyInfo.parentFamily.parent1.gender === 'MALE' ?
                    'Cha' :
                    'Mẹ'}
                        </p>
                      </div>
                    </button>
              }
                  {familyInfo.parentFamily.parent2 &&
              <button
                onClick={() =>
                onPersonClick(familyInfo.parentFamily!.parent2!.id)
                }
                className="w-full flex items-center gap-3 p-3 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors text-left">
                
                      <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${familyInfo.parentFamily.parent2.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                  
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warm-800">
                          {familyInfo.parentFamily.parent2.fullName}
                        </p>
                        <p className="text-xs text-warm-400">
                          {familyInfo.parentFamily.parent2.gender === 'MALE' ?
                    'Cha' :
                    'Mẹ'}
                        </p>
                      </div>
                    </button>
              }
                </div> :

            <button
              onClick={() => onAddParent(personId)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-xl text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
              
                  <UserPlusIcon className="w-4 h-4" />
                  Thêm cha/mẹ
                </button>
            }
            </div>

            {/* Spouses */}
            <div>
              <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
                Vợ/Chồng
              </h4>
              {familyInfo.spouseFamilies.length > 0 ?
            <div className="space-y-3">
                  {familyInfo.spouseFamilies.map((sf) => {
                const spouse =
                sf.parent1.id === personId ? sf.parent2 : sf.parent1;
                if (!spouse) return null;
                return (
                  <div key={sf.id} className="bg-warm-50 rounded-xl p-3">
                        <button
                      onClick={() => onPersonClick(spouse.id)}
                      className="w-full flex items-center gap-3 text-left hover:bg-warm-100 rounded-lg p-1 -m-1 transition-colors">
                      
                          <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${spouse.gender === 'MALE' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                        
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-800">
                              {spouse.fullName}
                            </p>
                            <p className="text-xs text-warm-400">
                              {sf.unionType === 'MARRIED' ?
                          '💍 Kết hôn' :
                          sf.unionType === 'DIVORCED' ?
                          'Ly hôn' :
                          'Bạn đời'}
                            </p>
                          </div>
                        </button>
                        {/* Children of this family */}
                        {sf.children.length > 0 &&
                    <div className="mt-3 pt-3 border-t border-warm-100">
                            <p className="text-xs text-warm-400 mb-2">
                              Con ({sf.children.length})
                            </p>
                            <div className="space-y-1.5">
                              {sf.children.map((child) =>
                        <button
                          key={child.id}
                          onClick={() => onPersonClick(child.id)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-warm-100 transition-colors text-left">
                          
                                  <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center ${child.gender === 'MALE' ? 'bg-blue-50 text-blue-400' : 'bg-pink-50 text-pink-400'}`}>
                            
                                    <UserIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-sm text-warm-700">
                                    {child.fullName}
                                  </span>
                                </button>
                        )}
                            </div>
                          </div>
                    }
                        <button
                      onClick={() => onAddChild(sf.id)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 border border-dashed border-warm-200 rounded-lg text-xs text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
                      
                          <UserPlusIcon className="w-3.5 h-3.5" />
                          Thêm con
                        </button>
                      </div>);

              })}
                </div> :
            null}
              <button
              onClick={() => onAddSpouse(personId)}
              className="mt-3 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-warm-200 rounded-xl text-sm text-warm-400 hover:border-warm-300 hover:text-warm-500 transition-colors">
              
                <HeartIcon className="w-4 h-4" />
                Thêm vợ/chồng
              </button>
            </div>
          </div>
        }

        {activeTab === 'events' &&
        <div>
            {events.length === 0 ?
          <div className="text-center py-8">
                <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có sự kiện nào</p>
              </div> :

          <div className="space-y-3">
                {events.map((event) =>
            <div key={event.id} className="p-4 bg-warm-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-warm-800">
                      {event.name}
                    </h4>
                    {event.description &&
              <p className="text-xs text-warm-400 mt-1">
                        {event.description}
                      </p>
              }
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(event.startedAt)}
                      </span>
                      {event.participants.length > 0 &&
                <span className="flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          {event.participants.length} người
                        </span>
                }
                    </div>
                  </div>
            )}
              </div>
          }
          </div>
        }

        {activeTab === 'addresses' &&
        <div>
            {addresses.length === 0 ?
          <div className="text-center py-8">
                <MapPinIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có địa chỉ nào</p>
              </div> :

          <div className="space-y-3">
                {addresses.map((addr) =>
            <div key={addr.id} className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-warm-800">
                          {addr.formattedAddress ||
                    `${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                        </p>
                        {addr.addressType &&
                  <span className="inline-block mt-1 px-2 py-0.5 bg-warm-100 rounded-md text-xs text-warm-500">
                            {addr.addressType}
                          </span>
                  }
                      </div>
                      {addr.isPrimary &&
                <span className="px-2 py-0.5 bg-heritage-gold/10 text-heritage-gold text-xs font-medium rounded-md">
                          Chính
                        </span>
                }
                    </div>
                  </div>
            )}
              </div>
          }
          </div>
        }

        {activeTab === 'media' &&
        <div>
            {media.length === 0 ?
          <div className="text-center py-8">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                <p className="text-sm text-warm-400">Chưa có media nào</p>
              </div> :

          <div className="grid grid-cols-2 gap-3">
                {media.map((file) =>
            <div
              key={file.id}
              className="rounded-xl overflow-hidden bg-warm-50 border border-warm-100">
              
                    {file.mediaFileType === 'IMAGE' ?
              <img
                src={file.fileUrl}
                alt={file.fileName}
                className="w-full h-32 object-cover" /> :


              <div className="w-full h-32 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-warm-300" />
                      </div>
              }
                    <div className="p-2">
                      <p className="text-xs text-warm-600 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-warm-400">
                        {file.mediaFileType}
                      </p>
                    </div>
                  </div>
            )}
              </div>
          }
          </div>
        }
      </div>
    </div>);

}