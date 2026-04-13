import { useState, useEffect, useCallback } from 'react';
import {
  XIcon, Trash2Icon, ImageIcon, FileIcon, PlayCircleIcon,
  LoaderIcon, FolderIcon, PlusIcon, PencilIcon, ChevronLeftIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { albumService } from '../../services/albumService';
import type { Album } from '../../services/albumService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { MediaFile } from '../../types/media';

interface TreeMediaGalleryProps {
  treeId: string;
  title?: string;
  onClose: () => void;
  onRefresh?: () => void;
  onUploadClick?: (albumId?: string) => void;
}

type FilterType = 'all' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export function TreeMediaGallery({
  treeId,
  title = 'Thư viện ảnh',
  onClose,
  onRefresh,
  onUploadClick,
}: TreeMediaGalleryProps) {
  // ── Albums ────────────────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Album CRUD
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumFormName, setAlbumFormName] = useState('');
  const [albumFormDesc, setAlbumFormDesc] = useState('');
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);

  // ── Media ─────────────────────────────────────────────────────────────────────
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  // ── Fetch albums ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingAlbums(true);
    albumService.getAlbums(treeId)
      .then((res) => { if (res.success) setAlbums(res.data); })
      .catch(() => showErrorToast('Không thể tải album'))
      .finally(() => setLoadingAlbums(false));
  }, [treeId]);

  // ── Fetch media when album selected ──────────────────────────────────────────
  const fetchMedia = useCallback(async (albumId: string) => {
    setLoadingMedia(true);
    setMedia([]);
    setSelectedMedia(null);
    try {
      const res = await mediaService.getTreeMedia(treeId, albumId);
      if (res.success && res.data) setMedia(res.data);
    } catch {
      showErrorToast('Không thể tải media');
    } finally {
      setLoadingMedia(false);
    }
  }, [treeId]);

  useEffect(() => {
    if (selectedAlbum) fetchMedia(selectedAlbum.id);
  }, [selectedAlbum, fetchMedia]);

  // ── Album CRUD ────────────────────────────────────────────────────────────────
  const handleCreateAlbum = async () => {
    if (!albumFormName.trim()) return;
    setSavingAlbum(true);
    try {
      const res = await albumService.createAlbum(treeId, {
        name: albumFormName.trim(),
        description: albumFormDesc.trim() || undefined,
      });
      if (res.success) {
        setAlbums((p) => [...p, res.data]);
        showSuccessToast('Tạo album thành công');
        setShowCreateAlbum(false);
        setAlbumFormName('');
        setAlbumFormDesc('');
      }
    } catch { showErrorToast('Không thể tạo album'); }
    finally { setSavingAlbum(false); }
  };

  const handleUpdateAlbum = async () => {
    if (!editingAlbum || !albumFormName.trim()) return;
    setSavingAlbum(true);
    try {
      const res = await albumService.updateAlbum(treeId, editingAlbum.id, {
        name: albumFormName.trim(),
        description: albumFormDesc.trim() || undefined,
      });
      if (res.success) {
        setAlbums((p) => p.map((a) => (a.id === editingAlbum.id ? res.data : a)));
        if (selectedAlbum?.id === editingAlbum.id) setSelectedAlbum(res.data);
        showSuccessToast('Cập nhật album thành công');
        setEditingAlbum(null);
        setAlbumFormName('');
        setAlbumFormDesc('');
      }
    } catch { showErrorToast('Không thể cập nhật album'); }
    finally { setSavingAlbum(false); }
  };

  const handleDeleteAlbum = async (album: Album) => {
    if (!confirm(`Xóa album "${album.name}"? Tất cả media trong album cũng sẽ bị xóa.`)) return;
    setDeletingAlbumId(album.id);
    try {
      const res = await albumService.deleteAlbum(treeId, album.id);
      if (res.success) {
        setAlbums((p) => p.filter((a) => a.id !== album.id));
        if (selectedAlbum?.id === album.id) { setSelectedAlbum(null); setMedia([]); }
        showSuccessToast('Xóa album thành công');
      }
    } catch { showErrorToast('Không thể xóa album'); }
    finally { setDeletingAlbumId(null); }
  };

  // ── Media delete ──────────────────────────────────────────────────────────────
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa tệp này?')) return;
    setDeleting(mediaId);
    try {
      const res = await mediaService.deleteTreeMedia(treeId, mediaId);
      if (res.success) {
        showSuccessToast('Xóa tệp thành công');
        setMedia((p) => p.filter((m) => m.id !== mediaId));
        if (selectedMedia?.id === mediaId) setSelectedMedia(null);
        // Update album count
        if (selectedAlbum) {
          setAlbums((p) => p.map((a) =>
            a.id === selectedAlbum.id ? { ...a, mediaFileSize: a.mediaFileSize - 1 } : a
          ));
        }
        onRefresh?.();
      }
    } catch { showErrorToast('Không thể xóa tệp'); }
    finally { setDeleting(null); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getSimpleType = (item: MediaFile): 'IMAGE' | 'VIDEO' | 'DOCUMENT' => {
    const url = item.fileUrl.toLowerCase();
    if (url.match(/\.(mp4|mov|avi|webm|mkv)(\?|$)/)) return 'VIDEO';
    if (url.match(/\.(pdf|doc|docx|xls|xlsx)(\?|$)/)) return 'DOCUMENT';
    return 'IMAGE';
  };

  const filteredMedia = media.filter(
    (m) => filterType === 'all' || getSimpleType(m) === filterType
  );

  const getMediaPreview = (item: MediaFile, cover = false) => {
    const url = item.fileUrl.toLowerCase();
    const isVideo = url.match(/\.(mp4|mov|avi|webm|mkv)(\?|$)/);

    if (isVideo) {
      return (
        <video
          src={item.fileUrl}
          controls={!cover}          // thumbnail thì không cần controls
          muted
          playsInline
          preload="metadata"         // chỉ load metadata, không load cả file
          className={`w-full h-full ${cover ? 'object-cover' : 'object-contain'}`}
        />
      );
    }

    if (!isVideo) {
      const isDoc = url.match(/\.(pdf|doc|docx|xls|xlsx)(\?|$)/);
      if (isDoc) {
        return (
          <div className="w-full h-full bg-warm-100 flex items-center justify-center">
            <FileIcon className="w-10 h-10 text-warm-300" />
          </div>
        );
      }
      return (
        <img
          src={item.fileUrl}
          alt={item.fileName}
          className={`w-full h-full ${cover ? 'object-cover' : 'object-contain'}`}
        />
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-warm-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button onClick={() => setSelectedAlbum(null)}
              className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors text-warm-500">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-warm-900">
              {selectedAlbum ? selectedAlbum.name : title}
            </h2>
            {selectedAlbum && (
              <p className="text-xs text-warm-400 mt-0.5">{media.length} file</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedAlbum && onUploadClick && (
            <button
              onClick={() => onUploadClick(selectedAlbum.id)}
              className="px-3 py-1.5 rounded-lg bg-heritage-gold text-white text-sm font-medium hover:bg-heritage-gold/90 transition-colors"
            >
              Tải lên
            </button>
          )}
          {!selectedAlbum && (
            <button
              onClick={() => { setShowCreateAlbum(true); setEditingAlbum(null); setAlbumFormName(''); setAlbumFormDesc(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-sm font-medium hover:bg-warm-200 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Album mới
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── ALBUM LIST VIEW ───────────────────────────────────────────────────── */}
      {!selectedAlbum ? (
        <div className="flex-1 overflow-y-auto">
          {/* Create / Edit album form */}
          {(showCreateAlbum || editingAlbum) && (
            <div className="mb-4 p-4 bg-warm-50 rounded-xl border border-warm-200 space-y-3">
              <h3 className="text-sm font-semibold text-warm-700">
                {editingAlbum ? 'Sửa album' : 'Tạo album mới'}
              </h3>
              <input
                type="text"
                value={albumFormName}
                onChange={(e) => setAlbumFormName(e.target.value)}
                placeholder="Tên album *"
                className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold"
              />
              <input
                type="text"
                value={albumFormDesc}
                onChange={(e) => setAlbumFormDesc(e.target.value)}
                placeholder="Mô tả (tùy chọn)"
                className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateAlbum(false); setEditingAlbum(null); }}
                  className="flex-1 py-2 text-sm bg-warm-100 text-warm-600 rounded-lg hover:bg-warm-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={editingAlbum ? handleUpdateAlbum : handleCreateAlbum}
                  disabled={savingAlbum || !albumFormName.trim()}
                  className="flex-1 py-2 text-sm bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {savingAlbum && <LoaderIcon className="w-3.5 h-3.5 animate-spin" />}
                  {editingAlbum ? 'Lưu' : 'Tạo'}
                </button>
              </div>
            </div>
          )}

          {loadingAlbums ? (
            <div className="flex items-center justify-center py-16">
              <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderIcon className="w-14 h-14 text-warm-200 mb-4" />
              <p className="text-warm-500 font-medium">Chưa có album nào</p>
              <p className="text-warm-400 text-sm mt-1">Tạo album để tổ chức ảnh/video của gia phả</p>
              <button
                onClick={() => { setShowCreateAlbum(true); setAlbumFormName(''); setAlbumFormDesc(''); }}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-heritage-gold text-white text-sm font-medium rounded-lg hover:bg-heritage-gold/90 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Tạo album đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="group relative bg-warm-50 rounded-xl border border-warm-100 hover:border-warm-200 overflow-hidden transition-all cursor-pointer"
                  onClick={() => setSelectedAlbum(album)}
                >
                  {/* Cover placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center">
                    <FolderOpenIcon className="w-10 h-10 text-warm-300" />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-warm-800 truncate">{album.name}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{album.mediaFileSize} file</p>
                    {album.description && (
                      <p className="text-xs text-warm-400 mt-1 line-clamp-1 italic">{album.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAlbum(album);
                        setShowCreateAlbum(false);
                        setAlbumFormName(album.name);
                        setAlbumFormDesc(album.description || '');
                      }}
                      className="p-1.5 bg-white rounded-lg shadow text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album); }}
                      disabled={deletingAlbumId === album.id}
                      className="p-1.5 bg-white rounded-lg shadow text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingAlbumId === album.id
                        ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2Icon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── MEDIA GRID VIEW ─────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap flex-shrink-0">
            {(['all', 'IMAGE', 'VIDEO', 'DOCUMENT'] as FilterType[]).map((type) => {
              const labels: Record<FilterType, string> = { all: 'Tất cả', IMAGE: 'Ảnh', VIDEO: 'Video', DOCUMENT: 'Tài liệu' };
              const count = type === 'all' ? media.length : media.filter((m) => m.mediaFileType.toUpperCase() === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterType === type ? 'bg-heritage-gold text-white' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                    }`}
                >
                  {labels[type]} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
              {loadingMedia ? (
                <div className="flex items-center justify-center h-40">
                  <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ImageIcon className="w-10 h-10 text-warm-200 mb-3" />
                  <p className="text-warm-400 text-sm">Chưa có file nào trong album này</p>
                  {onUploadClick && (
                    <button
                      onClick={() => onUploadClick(selectedAlbum.id)}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-heritage-gold text-white text-xs font-medium rounded-lg hover:bg-heritage-gold/90 transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Tải lên
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-warm-100 cursor-pointer hover:ring-2 ring-heritage-gold transition-all"
                      onClick={() => setSelectedMedia(item)}
                    >
                      {getMediaPreview(item, true)}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item.id); }}
                          disabled={deleting === item.id}
                          className="p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          {deleting === item.id
                            ? <LoaderIcon className="w-4 h-4 animate-spin" />
                            : <Trash2Icon className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded text-[10px]">
                        {getSimpleType(item) === 'IMAGE' ? <ImageIcon className="w-3 h-3" />
                          : getSimpleType(item) === 'VIDEO' ? <PlayCircleIcon className="w-3 h-3" />
                            : <FileIcon className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail pane */}
            {selectedMedia && (
              <div className="w-72 flex-shrink-0 flex flex-col bg-warm-50 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-warm-900 text-sm">Chi tiết</h3>
                  <button onClick={() => setSelectedMedia(null)} className="p-1 hover:bg-warm-200 rounded">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-warm-200 flex-shrink-0">
                  {getMediaPreview(selectedMedia)}
                </div>
                <div className="space-y-2 text-sm flex-1 overflow-y-auto">
                  <div>
                    <p className="text-warm-500 text-xs font-medium">Loại</p>
                    <p className="text-warm-800">{selectedMedia.mediaFileTypeDescription || selectedMedia.mediaFileType}</p>
                  </div>
                  <div>
                    <p className="text-warm-500 text-xs font-medium">Tên file</p>
                    <p className="text-warm-800 break-all text-xs">{selectedMedia.fileName}</p>
                  </div>
                  {selectedMedia.description && (
                    <div>
                      <p className="text-warm-500 text-xs font-medium">Mô tả</p>
                      <p className="text-warm-800 text-xs">{selectedMedia.description}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteMedia(selectedMedia.id)}
                  disabled={deleting === selectedMedia.id}
                  className="mt-3 w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting === selectedMedia.id
                    ? <><LoaderIcon className="w-4 h-4 animate-spin" />Đang xóa...</>
                    : <><Trash2Icon className="w-4 h-4" />Xóa file</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}