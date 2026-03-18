import React, { useState } from 'react';
import { XIcon, LoaderIcon, UploadIcon, ImageIcon } from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { MediaFile } from '../../types/media';
import type { LookupItem } from '../../types/common';

interface MediaUploadModalProps {
  isOpen: boolean;
  treeId: string;
  personId?: string;
  onClose: () => void;
  onSuccess: (media: MediaFile) => void;
}

export function MediaUploadModal({
  isOpen,
  treeId,
  personId,
  onClose,
  onSuccess
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [mediaTypeId, setMediaTypeId] = useState('');
  const [mediaTypes, setMediaTypes] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      loadMediaTypes();
    }
  }, [isOpen]);

  const loadMediaTypes = async () => {
    try {
      setLoading(true);
      const res = await lookupService.getMediaFileTypes();
      if (res.success) {
        setMediaTypes(res.data);
        if (res.data.length > 0) {
          setMediaTypeId(res.data[0].id);
        }
      }
    } catch (err: unknown) {
      showErrorToast('Không thể tải loại media');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!file) newErrors.file = 'Vui lòng chọn file';
    if (!mediaTypeId) newErrors.mediaTypeId = 'Vui lòng chọn loại media';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        showErrorToast('File quá lớn (tối đa 10MB)');
        return;
      }
      setFile(selectedFile);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = personId
        ? await mediaService.uploadPersonMedia(treeId, personId, file, mediaTypeId, description)
        : await mediaService.uploadTreeMedia(treeId, file, mediaTypeId, description);

      if (res.success) {
        showSuccessToast('Tải media thành công');
        onSuccess(res.data);
        handleClose();
      }
    } catch (err: unknown) {
      showErrorToast(err instanceof Error ? err.message : 'Không thể tải media');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDescription('');
    setMediaTypeId(mediaTypes.length > 0 ? mediaTypes[0].id : '');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-warm-900/50 animate-fade-in"
        onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
              <UploadIcon className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-warm-800">
                Tải media lên
              </h2>
              <p className="text-xs text-warm-400">
                {personId ? 'Tải ảnh/video cho thành viên' : 'Tải ảnh/video cho cây gia phả'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Chọn file
            </label>
            <label className="flex flex-col items-center justify-center w-full px-4 py-6 bg-warm-50 border-2 border-dashed border-warm-200 rounded-xl cursor-pointer hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all">
              <div className="flex flex-col items-center justify-center">
                {file ? (
                  <>
                    <ImageIcon className="w-8 h-8 text-heritage-gold mb-2" />
                    <p className="text-sm font-medium text-warm-800">{file.name}</p>
                    <p className="text-xs text-warm-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-8 h-8 text-warm-400 mb-2" />
                    <p className="text-sm font-medium text-warm-700">Click để chọn file</p>
                    <p className="text-xs text-warm-400">Hoặc kéo file vô đây</p>
                  </>
                )}
              </div>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden" />
            </label>
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
              Loại media
            </label>
            <select
              value={mediaTypeId}
              onChange={(e) => {
                setMediaTypeId(e.target.value);
                setErrors((prev) => ({ ...prev, mediaTypeId: '' }));
              }}
              disabled={loading}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${
                errors.mediaTypeId ? 'border-red-300' : 'border-warm-200'
              }`}>
              <option value="">Chọn loại media</option>
              {mediaTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
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
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none" />
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-700">
              📎 Hỗ trợ ảnh và video, tối đa 10MB trên file.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors disabled:opacity-60">
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {uploading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
