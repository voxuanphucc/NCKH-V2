import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  LoaderIcon,
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  CalendarDaysIcon,
  SettingsIcon,
  XIcon,
  SaveIcon,
  TreesIcon } from
'lucide-react';
import { treeService } from '../../services/treeService';
import { familyService } from '../../services/familyService';
import { eventService } from '../../services/eventService';
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

export function TreeDetailPage() {
  const navigate = useNavigate();
  const { treeId } = useParams<{ treeId: string }>();

  if (!treeId) {
    return <div>Invalid tree ID</div>;
  }
  const [tree, setTree] = useState<Tree | null>(null);
  const [graph, setGraph] = useState<TreeGraph | null>(null);
  const [events, setEvents] = useState<TreeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
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
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, graphRes, eventsRes] = await Promise.all([
      treeService.getTree(treeId),
      familyService.getGraph(treeId),
      eventService.getTreeEvents(treeId).catch(() => ({
        success: true,
        data: []
      }))]
      );
      if (treeRes.success) {
        setTree(treeRes.data);
        setEditName(treeRes.data.name);
        setEditDesc(treeRes.data.description || '');
      }
      if (graphRes.success) setGraph(graphRes.data);
      if (eventsRes.success) setEvents(eventsRes.data as TreeEvent[]);
    } catch {

      // Handle error
    } finally {setLoading(false);
    }
  }, [treeId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
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
      setAddPersonMode(null);
      fetchData();
    } catch (err) {
      throw err;
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
            <p className="text-sm text-warm-400 mt-0.5">
              {tree.totalPersons} người · {tree.totalMembers} thành viên
              {tree.description && ` · ${tree.description}`}
            </p>
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
        </div>
      </div>

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
              <h3 className="font-heading text-base font-semibold text-warm-800">
                Sự kiện
              </h3>
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
              <div key={event.id} className="p-3 bg-warm-50 rounded-xl">
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
                    </div>
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