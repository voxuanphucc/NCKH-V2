import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TreesIcon,
  UsersIcon,
  UserIcon,
  CalendarIcon,
  LoaderIcon,
  SearchIcon,
  MoreVerticalIcon,
  TrashIcon,
  PencilIcon,
  LogOutIcon,
  XIcon } from
'lucide-react';
import { treeService } from '../../services/treeService';
import type { Tree, CreateTreeRequest } from '../../types/tree';

export function DashboardPage() {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDesc, setNewTreeDesc] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fetchTrees = async () => {
    setLoading(true);
    try {
      const res = await treeService.getMyTrees();
      if (res.success) {
        setTrees(res.data);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ?
        err.message :
        'Không thể tải danh sách cây gia phả'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTrees();
  }, []);
  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data: CreateTreeRequest = {
        name: newTreeName,
        description: newTreeDesc
      };
      const res = await treeService.createTree(data);
      if (res.success) {
        setTrees((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        setNewTreeName('');
        setNewTreeDesc('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tạo cây gia phả');
    } finally {
      setCreating(false);
    }
  };
  const handleDeleteTree = async (treeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cây gia phả này?')) return;
    try {
      await treeService.deleteTree(treeId);
      setTrees((prev) => prev.filter((t) => t.id !== treeId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể xóa cây gia phả');
    }
    setMenuOpenId(null);
  };
  const handleLeaveTree = async (treeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn rời khỏi cây gia phả này?')) return;
    try {
      await treeService.leaveTree(treeId);
      setTrees((prev) => prev.filter((t) => t.id !== treeId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể rời cây gia phả');
    }
    setMenuOpenId(null);
  };
  const filteredTrees = trees.filter(
    (t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const roleLabels: Record<string, string> = {
    OWNER: 'Chủ sở hữu',
    ADMIN: 'Quản trị',
    EDITOR: 'Biên tập',
    VIEWER: 'Xem'
  };
  const roleColors: Record<string, string> = {
    OWNER: 'bg-heritage-gold/15 text-heritage-gold',
    ADMIN: 'bg-heritage-red/10 text-heritage-red',
    EDITOR: 'bg-heritage-sage/15 text-heritage-sage',
    VIEWER: 'bg-warm-200 text-warm-600'
  };
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-warm-800 mb-2">
          Cây gia phả của tôi
        </h1>
        <p className="text-warm-500">
          Quản lý và xem các cây gia phả mà bạn đang tham gia
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm cây gia phả..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
          
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors flex-shrink-0">
          
          <PlusIcon className="w-4 h-4" />
          Tạo cây mới
        </button>
      </div>

      {error &&
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in-up">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Đóng
          </button>
        </div>
      }

      {/* Tree list */}
      {loading ?
      <div className="flex items-center justify-center py-20">
          <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
        </div> :
      filteredTrees.length === 0 ?
      <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-warm-100 flex items-center justify-center">
            <TreesIcon className="w-10 h-10 text-warm-300" />
          </div>
          <h3 className="font-heading text-xl font-semibold text-warm-700 mb-2">
            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cây gia phả nào'}
          </h3>
          <p className="text-warm-400 mb-6">
            {searchQuery ?
          'Thử tìm kiếm với từ khóa khác' :
          'Bắt đầu bằng cách tạo cây gia phả đầu tiên của bạn'}
          </p>
          {!searchQuery &&
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors">
          
              <PlusIcon className="w-4 h-4" />
              Tạo cây gia phả
            </button>
        }
        </div> :

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filteredTrees.map((tree) =>
        <div
          key={tree.id}
          className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden animate-fade-in-up group">
          
              {/* Card header with pattern */}
              <div className="h-24 bg-gradient-to-br from-warm-700 to-warm-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern
                    id={`p-${tree.id}`}
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse">
                    
                        <circle cx="20" cy="10" r="2" fill="#C49A3C" />
                        <line
                      x1="20"
                      y1="12"
                      x2="20"
                      y2="25"
                      stroke="#C49A3C"
                      strokeWidth="1" />
                    
                        <line
                      x1="20"
                      y1="25"
                      x2="10"
                      y2="35"
                      stroke="#C49A3C"
                      strokeWidth="0.7" />
                    
                        <line
                      x1="20"
                      y1="25"
                      x2="30"
                      y2="35"
                      stroke="#C49A3C"
                      strokeWidth="0.7" />
                    
                      </pattern>
                    </defs>
                    <rect
                  width="100%"
                  height="100%"
                  fill={`url(#p-${tree.id})`} />
                
                  </svg>
                </div>
                <div className="absolute bottom-3 left-4">
                  <span
                className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg ${roleColors[tree.myRole] || roleColors.VIEWER}`}>
                
                    {roleLabels[tree.myRole] || tree.myRole}
                  </span>
                </div>
                {/* Menu button */}
                <div className="absolute top-3 right-3">
                  <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === tree.id ? null : tree.id);
                }}
                className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
                
                    <MoreVerticalIcon className="w-4 h-4" />
                  </button>
                  {menuOpenId === tree.id &&
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-warm-200 py-1 z-10 animate-fade-in">
                      <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/trees/${tree.id}`);
                    setMenuOpenId(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50 transition-colors">
                  
                        <PencilIcon className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                      {tree.myRole === 'OWNER' ?
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTree(tree.id);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  
                          <TrashIcon className="w-4 h-4" />
                          Xóa cây
                        </button> :

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveTree(tree.id);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  
                          <LogOutIcon className="w-4 h-4" />
                          Rời khỏi
                        </button>
                }
                    </div>
              }
                </div>
              </div>

              {/* Card body */}
              <button
            onClick={() => navigate(`/trees/${tree.id}`)}
            className="w-full text-left p-5">
            
                <h3 className="font-heading text-lg font-semibold text-warm-800 mb-1 group-hover:text-heritage-red transition-colors">
                  {tree.name}
                </h3>
                <p className="text-sm text-warm-400 line-clamp-2 mb-4 min-h-[2.5rem]">
                  {tree.description || 'Chưa có mô tả'}
                </p>
                <div className="flex items-center gap-4 text-xs text-warm-400">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    {tree.totalPersons} người
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {tree.totalMembers} thành viên
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(tree.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </button>
            </div>
        )}
        </div>
      }

      {/* Create Tree Modal */}
      {showCreateModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
          className="absolute inset-0 bg-warm-900/50 animate-fade-in"
          onClick={() => setShowCreateModal(false)} />
        
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-warm-100">
              <h2 className="font-heading text-xl font-semibold text-warm-800">
                Tạo cây gia phả mới
              </h2>
              <button
              onClick={() => setShowCreateModal(false)}
              className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTree} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Tên cây gia phả <span className="text-red-500">*</span>
                </label>
                <input
                type="text"
                value={newTreeName}
                onChange={(e) => setNewTreeName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="VD: Gia phả họ Nguyễn" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                value={newTreeDesc}
                onChange={(e) => setNewTreeDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none"
                placeholder="Mô tả về cây gia phả..." />
              
              </div>
              <div className="flex gap-3 pt-2">
                <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors">
                
                  Hủy
                </button>
                <button
                type="submit"
                disabled={creating || !newTreeName.trim()}
                className="flex-1 py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                
                  {creating && <LoaderIcon className="w-4 h-4 animate-spin" />}
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}