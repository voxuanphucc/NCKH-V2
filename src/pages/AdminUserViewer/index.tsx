import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchIcon, LoaderIcon, UserIcon } from 'lucide-react';
import { userService } from '../../services/userService';
import type { User } from '../../types/user';
import { showErrorToast } from '../../utils/validation';

export function AdminUserViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [userId, setUserId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await userService.getUser(targetId);
      if (res.success) {
        setUser(res.data);
      } else {
        showErrorToast(res.message || 'Không thể tải user');
        setUser(null);
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể tải user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchUser(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-warm-800">Admin: Xem user</h1>
        <p className="text-sm text-warm-500">Theo `GET /api/v1/users/{'{id}'}` (chỉ ADMIN).</p>
      </div>

      <div className="bg-white rounded-2xl border border-warm-200/60 p-4 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUser(userId.trim());
          }}
          className="flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <div className="flex-1 relative">
            <SearchIcon className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập userId (UUID)..."
              className="w-full pl-9 pr-3 py-2.5 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 text-warm-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-heritage-gold text-white font-medium hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
            Tìm
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
          </div>
        ) : !user ? (
          <div className="py-16 text-center">
            <UserIcon className="w-12 h-12 text-warm-200 mx-auto mb-3" />
            <p className="text-warm-500">Chưa có dữ liệu user</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-warm-100 overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-7 h-7 text-warm-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-warm-800 truncate">{user.fullName}</p>
                <p className="text-sm text-warm-500 truncate">{user.email}</p>
                <p className="text-xs text-warm-400 truncate">{user.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
                <p className="text-warm-500">UserName</p>
                <p className="font-semibold text-warm-800">{user.userName}</p>
              </div>
              <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
                <p className="text-warm-500">Số điện thoại</p>
                <p className="font-semibold text-warm-800">{user.phoneNumber || '-'}</p>
              </div>
              <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
                <p className="text-warm-500">Status</p>
                <p className="font-semibold text-warm-800">{user.status}</p>
              </div>
              <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
                <p className="text-warm-500">Role</p>
                <p className="font-semibold text-warm-800">{user.role || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

