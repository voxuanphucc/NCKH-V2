import React, { useState } from 'react';
import { XIcon, LoaderIcon, UploadIcon, ImageIcon, FolderIcon, PlusIcon } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { albumService } from '../../services/albumService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { MediaFile } from '../../types/media';
import type { LookupItem } from '../../types/common';
import type { Album } from '../../services/albumService';

interface MediaUploadModalProps {
  isOpen: boolean;
  treeId: string;
  personId?: string;
  defaultAlbumId?: string;
  onClose: () => void;
  onSuccess: (media: MediaFile) => void;
  onAlbumCreated?: (album: Album) => void;
}

export function MediaUploadModal({
  isOpen,
  treeId,
  personId,
  defaultAlbumId,
  onClose,
  onSuccess,
  onAlbumCreated,
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [mediaTypeId, setMediaTypeId] = useState('');
  const [mediaTypes, setMediaTypes] = useState<LookupItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(defaultAlbumId || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create album inline
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedAlbumId(defaultAlbumId || '');
    }
  }, [isOpen, defaultAlbumId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, albumsRes] = await Promise.all([
        lookupService.getMediaFileTypes(),
        personId ? Promise.resolve({ success: true, data: [] }) : albumService.getAlbums(treeId),
      ]);
      if (typesRes.success && typesRes.data.length > 0) {
        setMediaTypes(typesRes.data);
        setMediaTypeId(typesRes.data[0].id);
      }
      if (albumsRes.success) {
        setAlbums(albumsRes.data as Album[]);
        if (!defaultAlbumId && (albumsRes.data as Album[]).length > 0) {
          setSelectedAlbumId((albumsRes.data as Album[])[0].id);
        }
      }
    } catch {
      showErrorToast('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const res = await albumService.createAlbum(treeId, {
        name: newAlbumName.trim(),
        description: newAlbumDesc.trim() || undefined,
      });
      if (res.success) {
        const album = res.data;
        setAlbums((prev) => [...prev, album]);
        setSelectedAlbumId(album.id);
        setNewAlbumName('');
        setNewAlbumDesc('');
        setShowCreateAlbum(false);
        showSuccessToast('Tạo album thành công');
        onAlbumCreated?.(album);
      }
    } catch {
      showErrorToast('Không thể tạo album');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!file) newErrors.file = 'Vui lòng chọn file';
    if (!mediaTypeId) newErrors.mediaTypeId = 'Vui lòng chọn loại media';
    if (!personId && !selectedAlbumId) newErrors.albumId = 'Vui lòng chọn album';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      showErrorToast('File quá lớn (tối đa 10MB)');
      return;
    }
    setFile(selectedFile);
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !file) return;

    setUploading(true);
    try {
      const res = personId
        ? await mediaService.uploadPersonMedia(treeId, personId, file, mediaTypeId, description)
        : await mediaService.uploadTreeMedia(treeId, file, mediaTypeId, selectedAlbumId, description);

      if (res.success) {
        showSuccessToast('Tải media thành công');
        onSuccess(res.data);
        handleClose();
      }
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể tải media');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDescription('');
    setMediaTypeId(mediaTypes.length > 0 ? mediaTypes[0].id : '');
    setSelectedAlbumId(defaultAlbumId || (albums.length > 0 ? albums[0].id : ''));
    setErrors({});
    setShowCreateAlbum(false);
    setNewAlbumName('');
    setNewAlbumDesc('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-warm-900/50 animate-fade-in" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
              <UploadIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-warm-800">Tải media lên</h2>
              <p className="text-xs text-warm-400">
                {personId ? 'Ảnh/video cho thành viên' : 'Ảnh/video cho cây gia phả'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Chọn file
            </label>
            <label className="flex flex-col items-center justify-center w-full px-4 py-6 bg-warm-50 border-2 border-dashed border-warm-200 rounded-xl cursor-pointer hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all">
              {file ? (
                <>
                  <ImageIcon className="w-8 h-8 text-heritage-gold mb-2" />
                  <p className="text-sm font-medium text-warm-800">{file.name}</p>
                  <p className="text-xs text-warm-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadIcon className="w-8 h-8 text-warm-400 mb-2" />
                  <p className="text-sm font-medium text-warm-700">Click để chọn file</p>
                  <p className="text-xs text-warm-400">Ảnh hoặc video, tối đa 10MB</p>
                </>
              )}
              <input type="file" onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
            </label>
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
          </div>

          {/* Album selector — chỉ hiện khi upload lên tree (không phải person) */}
          {!personId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  Album *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateAlbum((p) => !p)}
                  className="flex items-center gap-1 text-xs text-heritage-gold hover:underline"
                >
                  <PlusIcon className="w-3 h-3" />
                  Tạo album mới
                </button>
              </div>

              {/* Inline create album */}
              {showCreateAlbum && (
                <div className="mb-3 p-3 bg-warm-50 rounded-xl border border-warm-200 space-y-2">
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Tên album *"
                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold"
                  />
                  <input
                    type="text"
                    value={newAlbumDesc}
                    onChange={(e) => setNewAlbumDesc(e.target.value)}
                    placeholder="Mô tả (tùy chọn)"
                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateAlbum(false)}
                      className="flex-1 py-1.5 text-xs bg-warm-100 text-warm-600 rounded-lg hover:bg-warm-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAlbum}
                      disabled={creatingAlbum || !newAlbumName.trim()}
                      className="flex-1 py-1.5 text-xs bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {creatingAlbum ? <LoaderIcon className="w-3 h-3 animate-spin" /> : null}
                      Tạo
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <LoaderIcon className="w-5 h-5 animate-spin text-heritage-gold" />
                </div>
              ) : albums.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <FolderIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Chưa có album nào. Hãy tạo album trước.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => { setSelectedAlbumId(album.id); setErrors((p) => ({ ...p, albumId: '' })); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${selectedAlbumId === album.id
                          ? 'bg-heritage-gold/10 border-heritage-gold text-heritage-gold font-medium'
                          : 'bg-white border-warm-200 text-warm-700 hover:border-warm-300'
                        }`}
                    >
                      <FolderIcon className="w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{album.name}</p>
                        <p className="text-[10px] text-warm-400">{album.mediaFileSize} file</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {errors.albumId && <p className="text-xs text-red-500 mt-1">{errors.albumId}</p>}
            </div>
          )}

          {/* Media Type */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Loại media
            </label>
            <select
              value={mediaTypeId}
              onChange={(e) => { setMediaTypeId(e.target.value); setErrors((p) => ({ ...p, mediaTypeId: '' })); }}
              disabled={loading}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${errors.mediaTypeId ? 'border-red-300' : 'border-warm-200'}`}
            >
              <option value="">Chọn loại media</option>
              {mediaTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.description}</option>
              ))}
            </select>
            {errors.mediaTypeId && <p className="text-xs text-red-500 mt-1">{errors.mediaTypeId}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả file media này (tùy chọn)..."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploading || !file || (!personId && !selectedAlbumId)}
              className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}