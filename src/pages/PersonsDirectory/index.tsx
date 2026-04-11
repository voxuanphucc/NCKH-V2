import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, PlusIcon, LoaderIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { personService } from '../../services/personService';
import type { Person } from '../../types/person';
import { showErrorToast } from '../../utils/validation';
import { CreatePersonModal } from '../../components/ui/CreatePersonModal';

export function PersonsDirectoryPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Person[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const query = useMemo(() => keyword.trim(), [keyword]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await personService.searchPersons(query || undefined, page, size);
        if (res.success) {
          setItems(res.data.content || []);
          setTotalPages(res.data.totalPages || 0);
          setTotalElements(res.data.totalElements || 0);
        } else {
          showErrorToast(res.message || 'Không thể tải danh sách person');
        }
      } catch (err: unknown) {
        showErrorToast(err instanceof Error ? err.message : 'Không thể tải danh sách person');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [query, page, size]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-warm-800">Danh bạ Person</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-heritage-gold text-white rounded-xl hover:bg-heritage-gold/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Tạo person
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-warm-200/60 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 relative">
            <SearchIcon className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="Nhập tên để tìm..."
              className="w-full pl-9 pr-3 py-2.5 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 text-warm-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-warm-500">Kích thước</label>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-3 py-2.5 border border-warm-200 rounded-xl text-warm-800"
            >
              {[10, 20, 50].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden">
        <div className="p-4 border-b border-warm-100 flex items-center justify-between">
          <p className="text-sm text-warm-500">
            Tổng: <span className="font-semibold text-warm-800">{totalElements}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
              className="p-2 rounded-xl border border-warm-200 text-warm-600 disabled:opacity-50 hover:bg-warm-50 transition-colors"
              title="Trang trước"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div className="text-sm text-warm-600">
              Trang <span className="font-semibold">{page + 1}</span>/{Math.max(1, totalPages)}
            </div>
            <button
              onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages}
              className="p-2 rounded-xl border border-warm-200 text-warm-600 disabled:opacity-50 hover:bg-warm-50 transition-colors"
              title="Trang sau"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <UserIcon className="w-12 h-12 text-warm-200 mx-auto mb-3" />
            <p className="text-warm-500">Không có person nào phù hợp</p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {items.map((p) => (
              <div key={p.id} className="p-4 hover:bg-warm-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-warm-100 flex items-center justify-center">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-warm-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-warm-800 truncate">{p.fullName || `${p.lastName} ${p.firstName}`}</p>
                    <p className="text-xs text-warm-500 truncate">{p.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-warm-500">Giới tính</p>
                    <p className="text-sm font-medium text-warm-800">{p.gender}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreatePersonModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          // refresh list
          setPage(0);
          personService.searchPersons(query || undefined, 0, size)
            .then((res) => {
              if (res.success) {
                setItems(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
              }
            })
            .catch(() => undefined);
        }}
      />
    </div>
  );
}

