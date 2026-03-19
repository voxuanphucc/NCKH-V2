import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  LoaderIcon,
  UserIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  CalendarDaysIcon,
  ImageIcon,
  SettingsIcon,
  XIcon,
  SaveIcon,
  TreesIcon,
  TrashIcon,
  LogOutIcon,
  ChevronDownIcon,
  MapPinIcon } from
'lucide-react';
import { treeService } from '../../services/treeService';
import { familyService } from '../../services/familyService';
import { eventService } from '../../services/eventService';
import { mediaService } from '../../services/mediaService';
import { addressService } from '../../services/addressService';
import { invitationService } from '../../services/invitationService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { Tree } from '../../types/tree';
import type { TreeGraph } from '../../types/family';
import type { TreeEvent } from '../../types/event';
import type {
  CreatePersonRequest,
  CreateSpouseRequest,
  CreateParentRequest } from
'../../types/person';
import { FamilyTreeD3 } from '../../components/ui/FamilyTreeD3';
import { PersonDetailPanel } from '../../components/ui/PersonDetailPanel';
import { AddPersonModal } from '../../components/ui/AddPersonModal';
import type { PersonFormData } from '../../components/ui/AddPersonModal';
import { MembersPanel } from '../../components/ui/MembersPanel';
import { TreeAddressesPanel } from '../../components/ui/TreeAddressesPanel';
import { AddEventModal } from '../../components/ui/AddEventModal';
import { EventDetailPanel } from '../../components/ui/EventDetailPanel';
import { TreeMediaGallery } from '../../components/ui/TreeMediaGallery';
import { MediaUploadModal } from '../../components/ui/MediaUploadModal';

export function TreeDetailPage() {
  const navigate = useNavigate();
  const { treeId } = useParams<{ treeId: string }>();
  const [tree, setTree] = useState<Tree | null>(null);
  const [graph, setGraph] = useState<TreeGraph | null>(null);
  const [events, setEvents] = useState<TreeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TreeEvent | null>(null);
  const [showTreeMedia, setShowTreeMedia] = useState(false);
  const [showUploadTreeMedia, setShowUploadTreeMedia] = useState(false);
  // Add person modal state
  const [addPersonMode, setAddPersonMode] = useState<
    'first' | 'spouse' | 'parent' | 'child' | null>(
    null);
  const [addPersonTargetId, setAddPersonTargetId] = useState<string>('');
  const [addPersonFamilyId, setAddPersonFamilyId] = useState<string>('');
  const [addPersonLoading, setAddPersonLoading] = useState(false);
  // Edit tree state
  const [isEditingTree, setIsEditingTree] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingTree, setSavingTree] = useState(false);
  // Settings menu state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [deletingTree, setDeletingTree] = useState(false);
  const [leavingTree, setLeavingTree] = useState(false);

  const cleanupTreeBeforeDelete = useCallback(
    async (currentTreeId: string) => {
      // Thử dọn lần lượt các phụ thuộc; nếu một bước lỗi thì log và tiếp tục
      try {
        const graphRes = await familyService.getGraph(currentTreeId);
        const graphData = graphRes.success && graphRes.data ? graphRes.data : null;

        // Families: gỡ children rồi xóa family
        if (graphData?.families && graphData.families.length > 0) {
          for (const family of graphData.families) {
            const childrenIds = family.childrenIds || [];
            for (const childId of childrenIds) {
              try {
                await familyService.removeChild(currentTreeId, family.id, childId);
              } catch (err) {
                console.error('Failed to remove child from family before delete tree:', {
                  familyId: family.id,
                  childId,
                  err
                });
              }
            }
            try {
              await familyService.deleteFamily(currentTreeId, family.id);
            } catch (err) {
              console.error('Failed to delete family before delete tree:', {
                familyId: family.id,
                err
              });
            }
          }
        }

        // Events: xóa tất cả event của tree (backend sẽ gỡ participant)
        try {
          const eventsRes = await eventService.getTreeEvents(currentTreeId);
          if (eventsRes.success && eventsRes.data) {
            for (const ev of eventsRes.data) {
              try {
                await eventService.deleteEvent(currentTreeId, ev.id);
              } catch (err) {
                console.error('Failed to delete event before delete tree:', {
                  eventId: ev.id,
                  err
                });
              }
            }
          }
        } catch (err) {
          console.error('Failed to load events before delete tree:', err);
        }

        // Tree media
        try {
          const mediaRes = await mediaService.getTreeMedia(currentTreeId);
          if (mediaRes.success && mediaRes.data) {
            for (const file of mediaRes.data) {
              try {
                await mediaService.deleteTreeMedia(currentTreeId, file.id);
              } catch (err) {
                console.error('Failed to delete tree media before delete tree:', {
                  mediaFileId: file.id,
                  err
                });
              }
            }
          }
        } catch (err) {
          console.error('Failed to load tree media before delete tree:', err);
        }

        // Media của từng person trong cây
        if (graphData?.persons && graphData.persons.length > 0) {
          for (const person of graphData.persons) {
            try {
              const mediaRes = await mediaService.getPersonMedia(currentTreeId, person.id);
              if (mediaRes.success && mediaRes.data) {
                for (const file of mediaRes.data) {
                  try {
                    await mediaService.deletePersonMedia(currentTreeId, person.id, file.id);
                  } catch (err) {
                    console.error('Failed to delete person media before delete tree:', {
                      personId: person.id,
                      mediaFileId: file.id,
                      err
                    });
                  }
                }
              }
            } catch (err) {
              console.error('Failed to load person media before delete tree:', {
                personId: person.id,
                err
              });
            }
          }
        }

        // Tree addresses
        try {
          const addrRes = await addressService.getTreeAddresses(currentTreeId);
          if (addrRes.success && addrRes.data) {
            for (const addr of addrRes.data) {
              try {
                await addressService.deleteTreeAddress(currentTreeId, addr.id);
              } catch (err) {
                console.error('Failed to delete tree address before delete tree:', {
                  addressId: addr.id,
                  err
                });
              }
            }
          }
        } catch (err) {
          console.error('Failed to load tree addresses before delete tree:', err);
        }

        // Addresses của từng person trong cây
        if (graphData?.persons && graphData.persons.length > 0) {
          for (const person of graphData.persons) {
            try {
              const addrRes = await addressService.getPersonAddresses(currentTreeId, person.id);
              if (addrRes.success && addrRes.data) {
                for (const addr of addrRes.data) {
                  try {
                    await addressService.deletePersonAddress(
                      currentTreeId,
                      person.id,
                      addr.id
                    );
                  } catch (err) {
                    console.error('Failed to delete person address before delete tree:', {
                      personId: person.id,
                      addressId: addr.id,
                      err
                    });
                  }
                }
              }
            } catch (err) {
              console.error('Failed to load person addresses before delete tree:', {
                personId: person.id,
                err
              });
            }
          }
        }

        // Share links
        try {
          const shareRes = await invitationService.getShareLinks(currentTreeId);
          if (shareRes.success && shareRes.data) {
            for (const link of shareRes.data) {
              try {
                await invitationService.deleteShareLink(currentTreeId, link.id);
              } catch (err) {
                console.error('Failed to delete share link before delete tree:', {
                  shareLinkId: link.id,
                  err
                });
              }
            }
          }
        } catch (err) {
          console.error('Failed to load share links before delete tree:', err);
        }
      } catch (err) {
        console.error('Unexpected error during cleanup before delete tree:', err);
      }
    },
    []
  );
  const fetchData = useCallback(async () => {
    if (!treeId) return;
    console.log('TreeDetail: fetchData called (refetching tree graph...)');
    setLoading(true);
    try {
      const [treeRes, graphRes, eventsRes] = await Promise.all([
      treeService.getTree(treeId),
      treeService.getGraph(treeId),
      eventService.getTreeEvents(treeId).catch(() => ({
        success: true,
        data: []
      }))]
      );
      
      if (graphRes.success && graphRes.data) {
        console.log('🌳 GRAPH DATA:');
        console.log(`  Total persons: ${graphRes.data.persons.length}`);
        console.log(`  Total families: ${graphRes.data.families.length}`);
        console.log(`  Root person ID: ${graphRes.data.meta?.rootPersonId}`);
        console.log(`  Total generations: ${graphRes.data.meta?.totalGenerations}`);
        
        console.log('📋 PERSONS:');
        graphRes.data.persons.forEach(p => {
          console.log(`  - ${p.id}: ${p.fullName} (Gen: ${p.generation})`);
        });
        
        console.log('👨‍👩‍👧 FAMILIES:');
        graphRes.data.families.forEach(f => {
          console.log(`  - Family ${f.id}:`);
          console.log(`      Parent1: ${f.parent1Id}`);
          console.log(`      Parent2: ${f.parent2Id}`);
          console.log(`      Children: ${f.childrenIds.join(', ')}`);
          console.log(`      Type: ${f.unionType}`);
        });
      }
      
      if (treeRes.success) {
        setTree(treeRes.data);
        setEditName(treeRes.data.name);
        setEditDesc(treeRes.data.description || '');
      }
      if (graphRes.success) setGraph(graphRes.data);
      if (eventsRes.success) setEvents(eventsRes.data as TreeEvent[]);
    } catch (error) {
      console.error('TreeDetail: fetchData error:', error);
    } finally {setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    if (!treeId) return;
    fetchData();
  }, [treeId, fetchData]);
  const handleAddPerson = async (data: PersonFormData) => {
    setAddPersonLoading(true);
    try {
      if (addPersonMode === 'first') {
        const req: CreatePersonRequest = {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          dateOfDeath: data.dateOfDeath,
          citizenIdentificationNumber: data.citizenIdentificationNumber,
          avatarUrl: data.avatarUrl
        };
        await familyService.createFirstPerson(treeId, req);
      } else if (addPersonMode === 'spouse') {
        const req: CreateSpouseRequest = {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          dateOfDeath: data.dateOfDeath,
          citizenIdentificationNumber: data.citizenIdentificationNumber,
          avatarUrl: data.avatarUrl,
          unionType: data.unionType || 'MARRIED',
          fromDate: data.fromDate,
          toDate: data.toDate
        };
        await familyService.addSpouse(treeId, addPersonTargetId, req);
      } else if (addPersonMode === 'parent') {
        const req: CreateParentRequest = {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          dateOfDeath: data.dateOfDeath,
          citizenIdentificationNumber: data.citizenIdentificationNumber,
          avatarUrl: data.avatarUrl,
          unionType: data.unionType || 'MARRIED',
          fromDate: data.fromDate,
          toDate: data.toDate
        };
        await familyService.addParent(treeId, addPersonTargetId, req);
      } else if (addPersonMode === 'child') {
        const req: CreatePersonRequest = {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          dateOfDeath: data.dateOfDeath,
          citizenIdentificationNumber: data.citizenIdentificationNumber,
          avatarUrl: data.avatarUrl
        };
        await familyService.addChild(treeId, addPersonFamilyId, req);
      }
      showSuccessToast('Thêm thành viên gia đình thành công');
      setAddPersonMode(null);
      fetchData();
    } finally {
      setAddPersonLoading(false);
    }
  };
  const handleSaveTree = async () => {
    setSavingTree(true);
    try {
      const res = await treeService.updateTree(treeId, {
        name: editName,
        description: editDesc
      });
      if (res.success) {
        showSuccessToast('Cập nhật cây gia phả thành công');
        setTree(res.data);
        setIsEditingTree(false);
      }
    } catch {

      // Handle error
    } finally {setSavingTree(false);
    }
  };
  const getTargetPersonName = () => {
    if (!graph || !addPersonTargetId) return undefined;
    const person = graph.persons.find((p) => p.id === addPersonTargetId);
    return person?.fullName || `${person?.lastName} ${person?.firstName}`;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <LoaderIcon className="w-10 h-10 text-heritage-gold animate-spin mx-auto mb-4" />
          <p className="text-warm-400">Đang tải cây gia phả...</p>
        </div>
      </div>);

  }
  if (!treeId) {
    return <div>Invalid tree ID</div>;
  }
  if (!tree) {
    return (
      <div className="text-center py-20">
        <p className="text-warm-500">Không tìm thấy cây gia phả</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-warm-100 text-warm-700 rounded-xl hover:bg-warm-200 transition-colors">
          
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>
      </div>);

  }
  const canEdit =
  tree.myRole === 'OWNER' ||
  tree.myRole === 'ADMIN' ||
  tree.myRole === 'EDITOR';
  
  const canDelete = tree.myRole === 'OWNER';
  
  const handleDeleteTree = async () => {
    if (!treeId) {
      showErrorToast('Không xác định được cây gia phả cần xóa');
      return;
    }
    setDeletingTree(true);
    try {
      // Debug logging
      console.log('=== DELETE TREE DEBUG ===');
      console.log('Tree ID:', treeId);
      console.log('Tree Name:', tree.name);
      console.log('User Role:', tree.myRole);
      console.log('Can Delete:', canDelete);
      console.log('API URL:', `${import.meta.env.VITE_API_URL}/trees/${treeId}`);

      // Dọn dữ liệu phụ thuộc trước khi gọi API xóa cây
      await cleanupTreeBeforeDelete(treeId);
      
      const res = await treeService.deleteTree(treeId);
      
      console.log('Delete Response:', res);
      
      if (res.success) {
        showSuccessToast('Xóa cây gia phả thành công');
        navigate('/dashboard');
      } else {
        console.warn('Delete returned success=false:', res.message);
        showErrorToast(res.message || 'Không thể xóa cây gia phả');
      }
    } catch (error) {
      console.error('=== DELETE TREE ERROR ===');
      console.error('Error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      console.error('========================');
    } finally {
      setDeletingTree(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleLeaveTree = async () => {
    setLeavingTree(true);
    try {
      const res = await treeService.leaveTree(treeId);
      if (res.success) {
        showSuccessToast('Rời khỏi cây gia phả thành công');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Leave tree error:', error);
    } finally {
      setLeavingTree(false);
      setShowLeaveConfirm(false);
    }
  };
  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-1 p-2 rounded-xl text-warm-400 hover:bg-warm-100 transition-colors">
            
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            {isEditingTree ?
            <div className="flex items-center gap-3">
                <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="font-heading text-2xl font-bold text-warm-800 bg-transparent border-b-2 border-heritage-gold focus:outline-none" />
              
                <button
                onClick={handleSaveTree}
                disabled={savingTree}
                className="p-2 rounded-lg bg-heritage-gold/10 text-heritage-gold hover:bg-heritage-gold/20 transition-colors">
                
                  {savingTree ?
                <LoaderIcon className="w-4 h-4 animate-spin" /> :

                <SaveIcon className="w-4 h-4" />
                }
                </button>
                <button
                onClick={() => setIsEditingTree(false)}
                className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
                
                  <XIcon className="w-4 h-4" />
                </button>
              </div> :

            <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-warm-800">
                  {tree.name}
                </h1>
                {canEdit &&
              <button
                onClick={() => setIsEditingTree(true)}
                className="p-1.5 rounded-lg text-warm-300 hover:text-warm-500 hover:bg-warm-100 transition-colors">
                
                    <PencilIcon className="w-4 h-4" />
                  </button>
              }
              </div>
            }
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-3 text-sm text-warm-500">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{tree.totalPersons} người</span>
                  <span className="text-xs text-warm-400">(trong cây gia phả)</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">{tree.totalMembers} thành viên</span>
                  <span className="text-xs text-warm-400">(người được mời xem cây)</span>
                </span>
              </div>
              {tree.description && (
                <div className="flex items-start gap-2 text-sm text-warm-500">
                  <span className="text-xs text-warm-400 font-medium mt-0.5">📝 Mô tả:</span>
                  <span className="text-warm-600 italic">{tree.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && graph && graph.persons.length === 0 &&
          <button
            onClick={() => setAddPersonMode('first')}
            className="flex items-center gap-2 px-4 py-2.5 bg-warm-800 text-cream text-sm font-medium rounded-xl hover:bg-warm-700 transition-colors">
            
              <UserPlusIcon className="w-4 h-4" />
              Thêm người đầu tiên
            </button>
          }
          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`p-2.5 rounded-xl border transition-colors ${showEvents ? 'bg-heritage-gold/10 border-heritage-gold/30 text-heritage-gold' : 'border-warm-200 text-warm-500 hover:bg-warm-50'}`}
            title="Sự kiện">
            
            <CalendarDaysIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMembers(true)}
            className="p-2.5 rounded-xl border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors"
            title="Thành viên">
            
            <UsersIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddresses(true)}
            className="p-2.5 rounded-xl border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors"
            title="Địa chỉ">
            
            <MapPinIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTreeMedia(true)}
            className={`p-2.5 rounded-xl border transition-colors ${showTreeMedia ? 'bg-heritage-gold/10 border-heritage-gold/30 text-heritage-gold' : 'border-warm-200 text-warm-500 hover:bg-warm-50'}`}
            title="Media">
            
            <ImageIcon className="w-4 h-4" />
          </button>
          
          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2.5 rounded-xl border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors"
              title="Cài đặt">
              
              <SettingsIcon className="w-4 h-4" />
            </button>
            
            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-warm-200 shadow-lg z-50">
                <div className="py-2">
                  {/* Leave Tree */}
                  <button
                    onClick={() => {
                      setShowLeaveConfirm(true);
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-warm-600 hover:bg-warm-50 transition-colors">
                    
                    <LogOutIcon className="w-4 h-4" />
                    Rời khỏi cây
                  </button>
                  
                  {/* Delete Tree - OWNER only */}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-warm-100">
                      
                      <TrashIcon className="w-4 h-4" />
                      Xóa cây
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-warm-800 mb-2">Xóa cây gia phả?</h3>
            <p className="text-sm text-warm-600 mb-6">
              Hành động này sẽ xóa toàn bộ cây gia phả và tất cả dữ liệu của nó. Điều này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-warm-100 text-warm-700 rounded-xl font-medium hover:bg-warm-200 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleDeleteTree}
                disabled={deletingTree}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                
                {deletingTree ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <TrashIcon className="w-4 h-4" />
                )}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-warm-800 mb-2">Rời khỏi cây gia phả?</h3>
            <p className="text-sm text-warm-600 mb-6">
              Bạn sẽ không còn có quyền truy cập vào cây gia phả này. Bạn có thể được mời lại sau.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-warm-100 text-warm-700 rounded-xl font-medium hover:bg-warm-200 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleLeaveTree}
                disabled={leavingTree}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                
                {leavingTree ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOutIcon className="w-4 h-4" />
                )}
                Rời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Graph */}
        <div className="flex-1 bg-white rounded-2xl border border-warm-200/60 overflow-hidden relative">
          {graph ?
          <FamilyTreeD3
            graph={graph}
            onPersonClick={(id) => setSelectedPersonId(id)}
            selectedPersonId={selectedPersonId || undefined} /> :


          <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TreesIcon className="w-16 h-16 mx-auto mb-4 text-warm-200" />
                <p className="text-warm-400">Không thể tải cây gia phả</p>
              </div>
            </div>
          }
        </div>

        {/* Events sidebar */}
        {showEvents &&
        <div className="w-80 bg-white rounded-2xl border border-warm-200/60 overflow-hidden flex flex-col animate-slide-in-right flex-shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-warm-100">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-semibold text-warm-800">
                  Sự kiện
                </h3>
                {canEdit && (
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-heritage-gold/10 text-heritage-gold hover:bg-heritage-gold/20 transition-colors"
                    title="Tạo sự kiện"
                  >
                    + Tạo
                  </button>
                )}
              </div>
              <button
              onClick={() => setShowEvents(false)}
              className="p-1 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {events.length === 0 ?
            <div className="text-center py-8">
                  <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                  <p className="text-sm text-warm-400">Chưa có sự kiện</p>
                </div> :

            <div className="space-y-3">
                  {events.map((event) =>
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left p-3 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors">
                      <h4 className="text-sm font-semibold text-warm-800">
                        {event.name}
                      </h4>
                      {event.description &&
                <p className="text-xs text-warm-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                }
                      <div className="flex items-center gap-2 mt-2 text-xs text-warm-400">
                        <CalendarDaysIcon className="w-3 h-3" />
                        {new Date(event.startedAt).toLocaleDateString('vi-VN')}
                      </div>
                      {event.participants.length > 0 &&
                <div className="mt-2 flex -space-x-1.5">
                          {event.participants.slice(0, 5).map((p) =>
                  <div
                    key={p.id}
                    className="w-6 h-6 rounded-full bg-warm-200 border-2 border-white flex items-center justify-center"
                    title={p.person.fullName}>
                    
                              <span className="text-[8px] font-bold text-warm-500">
                                {(p.person.fullName || '?')[0]}
                              </span>
                            </div>
                  )}
                          {event.participants.length > 5 &&
                  <div className="w-6 h-6 rounded-full bg-warm-100 border-2 border-white flex items-center justify-center">
                              <span className="text-[8px] font-bold text-warm-400">
                                +{event.participants.length - 5}
                              </span>
                            </div>
                  }
                        </div>
                }
                    </button>
              )}
                </div>
            }
            </div>
          </div>
        }
      </div>

      {/* Person detail panel */}
      {selectedPersonId &&
      <PersonDetailPanel
        personId={selectedPersonId}
        treeId={treeId}
        graph={graph || undefined}
        onClose={() => setSelectedPersonId(null)}
        onPersonClick={(id) => setSelectedPersonId(id)}
        onAddSpouse={(id) => {
          setAddPersonTargetId(id);
          setAddPersonMode('spouse');
        }}
        onAddParent={(id) => {
          setAddPersonTargetId(id);
          setAddPersonMode('parent');
        }}
        onAddChild={(familyId) => {
          setAddPersonFamilyId(familyId);
          setAddPersonMode('child');
        }}
        onRefresh={fetchData} />

      }

      {/* Members panel */}
      {showMembers &&
      <MembersPanel
        treeId={treeId}
        myRole={tree.myRole}
        onClose={() => setShowMembers(false)} />

      }

      {/* Tree Addresses panel */}
      {showAddresses &&
      <TreeAddressesPanel
        treeId={treeId}
        onClose={() => setShowAddresses(false)} />

      }

      {/* Tree media gallery */}
      {showTreeMedia && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[980px] bg-white shadow-2xl border-l border-warm-200 animate-slide-in-right">
          <div className="h-full p-6">
            <TreeMediaGallery
              treeId={treeId}
              title="Media của cây"
              onClose={() => setShowTreeMedia(false)}
              onUploadClick={() => setShowUploadTreeMedia(true)}
            />
          </div>
        </div>
      )}

      <MediaUploadModal
        isOpen={showUploadTreeMedia}
        treeId={treeId}
        onClose={() => setShowUploadTreeMedia(false)}
        onSuccess={() => {
          // Gallery tự fetch khi cần
        }}
      />

      {/* Add event modal */}
      <AddEventModal
        isOpen={showAddEventModal}
        treeId={treeId}
        mode="create"
        onClose={() => setShowAddEventModal(false)}
        onSuccess={(evt) => {
          setEvents((prev) => [evt, ...prev]);
          setShowAddEventModal(false);
        }}
      />

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-white shadow-2xl border-l border-warm-200 animate-slide-in-right">
          <div className="h-full p-6">
            <EventDetailPanel
              treeId={treeId}
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onRefresh={fetchData}
            />
          </div>
        </div>
      )}

      {/* Add person modal */}
      {addPersonMode &&
      <AddPersonModal
        mode={addPersonMode}
        onClose={() => setAddPersonMode(null)}
        onSubmit={handleAddPerson}
        loading={addPersonLoading}
        targetPersonName={getTargetPersonName()} />

      }
    </div>);

}