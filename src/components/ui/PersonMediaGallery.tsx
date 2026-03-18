import { useState, useEffect } from 'react';
import {
  XIcon,
  Trash2Icon,
  ImageIcon,
  FileIcon,
  PlayCircleIcon,
  LoaderIcon
} from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { MediaFile } from '../../types/media';

interface PersonMediaGalleryProps {
  treeId: string;
  personId: string;
  personName: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export function PersonMediaGallery({
  treeId,
  personId,
  personName,
  onClose,
  onRefresh
}: PersonMediaGalleryProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('all');

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const res = await mediaService.getPersonMedia(treeId, personId);
        if (res.success && res.data) {
          setMedia(res.data);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
        showErrorToast('Không thể tải thư viện ảnh');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [treeId, personId]);

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa tệp này?')) {
      return;
    }

    try {
      setDeleting(mediaId);
      const res = await mediaService.deleteTreeMedia(treeId, mediaId);
      if (res.success) {
        showSuccessToast('Xóa tệp thành công');
        setMedia(media.filter(m => m.id !== mediaId));
        if (selectedMedia?.id === mediaId) {
          setSelectedMedia(null);
        }
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      showErrorToast('Không thể xóa tệp');
    } finally {
      setDeleting(null);
    }
  };

  const filteredMedia = media.filter(m => 
    filterType === 'all' || m.mediaType === filterType
  );

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4" />;
      case 'VIDEO':
        return <PlayCircleIcon className="w-4 h-4" />;
      case 'DOCUMENT':
        return <FileIcon className="w-4 h-4" />;
      default:
        return <FileIcon className="w-4 h-4" />;
    }
  };

  const getMediaPreview = (mediaItem: Media) => {
    if (mediaItem.mediaType === 'IMAGE') {
      return (
        <img
          src={mediaItem.mediaUrl}
          alt={mediaItem.description || 'Media'}
          className="w-full h-full object-cover"
        />
      );
    } else if (mediaItem.mediaType === 'VIDEO') {
      return (
        <div className="relative w-full h-full bg-warm-100 flex items-center justify-center">
          <video
            src={mediaItem.mediaUrl}
            className="max-w-full max-h-full object-cover"
            controls
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-warm-100 flex items-center justify-center">
          <FileIcon className="w-12 h-12 text-warm-400" />
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-warm-200">
        <div>
          <h2 className="text-xl font-semibold text-warm-900">Ảnh & tài liệu</h2>
          <p className="text-sm text-warm-500 mt-1">{personName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-warm-100 transition-colors">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'IMAGE', 'VIDEO', 'DOCUMENT'].map(type => {
          const labels: Record<string, string> = {
            all: 'Tất cả',
            IMAGE: 'Ảnh',
            VIDEO: 'Video',
            DOCUMENT: 'Tài liệu'
          };
          return (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-heritage-gold text-white'
                  : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
              }`}>
              {labels[type]} ({media.filter(m => type === 'all' || m.mediaType === type).length})
            </button>
          );
        })}
      </div>

      {/* Gallery or Preview */}
      <div className="flex-1 overflow-hidden flex gap-4">
        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <FileIcon className="w-12 h-12 text-warm-300 mx-auto mb-3" />
                <p className="text-warm-500">Chưa có tệp nào</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredMedia.map(mediaItem => (
                <div
                  key={mediaItem.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-warm-100 cursor-pointer hover:ring-2 ring-heritage-gold transition-all"
                  onClick={() => setSelectedMedia(mediaItem)}>
                  <div className="w-full h-full">
                    {getMediaPreview(mediaItem)}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(mediaItem.id);
                      }}
                      disabled={deleting === mediaItem.id}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
                      {deleting === mediaItem.id ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
                    {getMediaIcon(mediaItem.mediaType)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Preview */}
        {selectedMedia && (
          <div className="w-80 flex flex-col bg-warm-50 rounded-lg p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-warm-900">Chi tiết</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 hover:bg-warm-200 rounded">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 mb-4 rounded-lg overflow-hidden bg-warm-200">
              {getMediaPreview(selectedMedia)}
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-warm-600 font-medium">Loại</p>
                <p className="text-warm-900">{selectedMedia.mediaType}</p>
              </div>

              {selectedMedia.description && (
                <div>
                  <p className="text-warm-600 font-medium">Mô tả</p>
                  <p className="text-warm-900 line-clamp-3">{selectedMedia.description}</p>
                </div>
              )}

              {selectedMedia.createdAt && (
                <div>
                  <p className="text-warm-600 font-medium">Ngày tải</p>
                  <p className="text-warm-900">
                    {new Date(selectedMedia.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDeleteMedia(selectedMedia.id)}
                disabled={deleting === selectedMedia.id}
                className="w-full mt-4 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting === selectedMedia.id ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2Icon className="w-4 h-4" />
                    Xóa tệp
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
