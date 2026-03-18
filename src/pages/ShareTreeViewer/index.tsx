import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LoaderIcon,
  ArrowLeftIcon,
  UsersIcon,
  CalendarDaysIcon,
  MapPinIcon
} from 'lucide-react';
import { treeService } from '../../services/treeService';
import { familyService } from '../../services/familyService';
import { FamilyTreeD3 } from '../../components/ui/FamilyTreeD3';
import { PersonCard } from '../../components/ui/PersonCard';
import type { Tree } from '../../types/tree';
import type { TreeGraph, TreeGraphPerson } from '../../types/family';

export function ShareTreeViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const shareToken = searchParams.get('token');
  const [tree, setTree] = useState<Tree | null>(null);
  const [graph, setGraph] = useState<TreeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<TreeGraphPerson | null>(null);

  useEffect(() => {
    const fetchSharedTree = async () => {
      if (!shareToken) {
        setError('Liên kết chia sẻ không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get shared tree data using token
        const treeRes = await treeService.getSharedTree(shareToken);
        if (treeRes.success && treeRes.data) {
          setTree(treeRes.data);
          
          // Get family graph
          const graphRes = await familyService.getGraph(treeRes.data.id);
          if (graphRes.success && graphRes.data) {
            setGraph(graphRes.data);
          }
        } else {
          setError(treeRes.message || 'Không thể tải cây gia phả');
        }
      } catch (err) {
        console.error('Error loading shared tree:', err);
        setError('Có lỗi xảy ra khi tải cây gia phả');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTree();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-warm-0">
        <div className="text-center">
          <LoaderIcon className="w-12 h-12 text-heritage-gold animate-spin mx-auto mb-4" />
          <p className="text-warm-500">Đang tải cây gia phả...</p>
        </div>
      </div>
    );
  }

  if (error || !tree || !graph) {
    return (
      <div className="flex items-center justify-center h-screen bg-warm-0">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-warm-900 mb-2">Liên kết không hợp lệ</h1>
          <p className="text-warm-500 mb-6 max-w-md">
            {error || 'Liên kết chia sẻ này không tồn tại hoặc đã hết hạn.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold-dark transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-0 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-heritage-gold hover:bg-warm-100 rounded-lg transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại
          </button>

          <h1 className="text-3xl font-bold text-warm-900 mb-2">{tree.name}</h1>
          <p className="text-warm-500">{tree.description}</p>
        </div>

        {/* Tree Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-heritage-gold" />
              <div>
                <p className="text-sm text-warm-600">Thành viên</p>
                <p className="text-2xl font-bold text-warm-900">{graph.persons.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="w-6 h-6 text-heritage-gold" />
              <div>
                <p className="text-sm text-warm-600">Thế hệ</p>
                <p className="text-2xl font-bold text-warm-900">
                  {graph.meta?.totalGenerations || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-6 h-6 text-heritage-gold" />
              <div>
                <p className="text-sm text-warm-600">Được chia sẻ bởi</p>
                <p className="text-2xl font-bold text-warm-900">{tree.createdByUserName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tree Diagram */}
          <div className="col-span-2 bg-white rounded-lg p-4 h-96 overflow-hidden">
            <FamilyTreeD3
              data={graph}
              onPersonSelect={setSelectedPerson}
              selectedPersonId={selectedPerson?.id}
            />
          </div>

          {/* Person Details Panel */}
          <div className="bg-white rounded-lg p-4 overflow-y-auto h-96">
            {selectedPerson ? (
              <PersonCard person={selectedPerson} viewOnly />
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <UsersIcon className="w-12 h-12 text-warm-300 mx-auto mb-3" />
                  <p className="text-warm-500">Nhấp vào một người để xem chi tiết</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="mt-8 bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold text-warm-900 mb-4">Danh sách thành viên</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {graph.persons.map(person => (
              <div
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className="p-4 bg-warm-50 rounded-lg cursor-pointer hover:bg-warm-100 hover:ring-2 ring-heritage-gold transition-all">
                <div className="flex items-start gap-3">
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt={person.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-heritage-gold bg-opacity-20 flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-heritage-gold" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-warm-900">{person.fullName}</p>
                    <p className="text-xs text-warm-500">
                      Gen: {person.generation}
                    </p>
                    {person.dateOfBirth && (
                      <p className="text-xs text-warm-500">
                        {new Date(person.dateOfBirth).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-warm-500 text-sm">
          <p>© {new Date().getFullYear()} Family Tree. Chia sẻ với mục đích gia đình.</p>
        </div>
      </div>
    </div>
  );
}
